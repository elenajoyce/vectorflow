#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol, log};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Stream {
    pub id: u64,
    pub sender: Address,
    pub recipient: Address,
    pub token: Address,
    pub total_amount: i128,
    pub withdrawn_amount: i128,
    pub start_time: u64,
    pub stop_time: u64,
    pub active: bool,
}

#[contracttype]
pub enum DataKey {
    Stream(u64),
    StreamCount,
}

#[contract]
pub struct VectorFlowContract;

#[contractimpl]
impl VectorFlowContract {
    /// Creates a new continuous payment stream.
    pub fn create_stream(
        env: Env,
        sender: Address,
        recipient: Address,
        token: Address,
        amount: i128,
        start_time: u64,
        stop_time: u64,
    ) -> u64 {
        sender.require_auth();

        assert!(amount > 0, "Amount must be positive");
        assert!(start_time < stop_time, "Start time must be before stop time");
        
        let current_time = env.ledger().timestamp();
        assert!(stop_time > current_time, "Stop time must be in the future");

        // Transfer tokens from sender to contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &amount);

        // Fetch and increment stream count ID
        let mut count: u64 = env.storage().persistent().get(&DataKey::StreamCount).unwrap_or(0);
        count += 1;
        env.storage().persistent().set(&DataKey::StreamCount, &count);

        // Create stream state
        let stream = Stream {
            id: count,
            sender,
            recipient,
            token,
            total_amount: amount,
            withdrawn_amount: 0,
            start_time,
            stop_time,
            active: true,
        };

        env.storage().persistent().set(&DataKey::Stream(count), &stream);

        // Log streaming event
        log!(&env, "StreamCreated: id={}, amount={}", count, amount);
        env.events().publish(
            (Symbol::new(&env, "stream_created"), count),
            (stream.sender.clone(), stream.recipient.clone(), stream.total_amount),
        );

        count
    }

    /// Withdraws accrued tokens from a stream.
    pub fn withdraw_from_stream(env: Env, stream_id: u64, amount: i128) {
        assert!(amount > 0, "Withdraw amount must be positive");

        let mut stream = Self::get_stream(env.clone(), stream_id);
        assert!(stream.active, "Stream is not active");

        stream.recipient.require_auth();

        let claimable = Self::get_claimable_amount(env.clone(), stream_id);
        assert!(amount <= claimable, "Requested amount exceeds claimable balance");

        // Update withdrawn tracking
        stream.withdrawn_amount += amount;
        env.storage().persistent().set(&DataKey::Stream(stream_id), &stream);

        // Disburse tokens to recipient
        let token_client = token::Client::new(&env, &stream.token);
        token_client.transfer(&env.current_contract_address(), &stream.recipient, &amount);

        env.events().publish(
            (Symbol::new(&env, "stream_withdrawn"), stream_id),
            (stream.recipient.clone(), amount),
        );
    }

    /// Cancels a stream, returning the remaining unflowed balance to the sender and flowed to recipient.
    pub fn cancel_stream(env: Env, stream_id: u64) {
        let mut stream = Self::get_stream(env.clone(), stream_id);
        assert!(stream.active, "Stream is already inactive");

        // Either sender or recipient can cancel the stream
        if !stream.sender.has_auth() {
            stream.recipient.require_auth();
        }

        let total_claimable = Self::get_claimable_amount(env.clone(), stream_id);
        let remaining_deposit = stream.total_amount - stream.withdrawn_amount;
        let refund_to_sender = remaining_deposit - total_claimable;

        stream.active = false;
        env.storage().persistent().set(&DataKey::Stream(stream_id), &stream);

        let token_client = token::Client::new(&env, &stream.token);

        // Pay remaining flowed funds to recipient
        if total_claimable > 0 {
            token_client.transfer(&env.current_contract_address(), &stream.recipient, &total_claimable);
        }

        // Return unflowed deposit to sender
        if refund_to_sender > 0 {
            token_client.transfer(&env.current_contract_address(), &stream.sender, &refund_to_sender);
        }

        env.events().publish(
            (Symbol::new(&env, "stream_cancelled"), stream_id),
            (stream.sender.clone(), refund_to_sender),
        );
    }

    /// Queries the stream information.
    pub fn get_stream(env: Env, stream_id: u64) -> Stream {
        env.storage()
            .persistent()
            .get(&DataKey::Stream(stream_id))
            .expect("Stream does not exist")
    }

    /// Calculates the current claimable (accrued but unwithdrawn) amount.
    pub fn get_claimable_amount(env: Env, stream_id: u64) -> i128 {
        let stream = Self::get_stream(env.clone(), stream_id);
        if !stream.active {
            return 0;
        }

        let current_time = env.ledger().timestamp();

        if current_time <= stream.start_time {
            return 0;
        }

        let total_flowed = if current_time >= stream.stop_time {
            stream.total_amount
        } else {
            let duration = (stream.stop_time - stream.start_time) as i128;
            let elapsed = (current_time - stream.start_time) as i128;
            (stream.total_amount * elapsed) / duration
        };

        total_flowed - stream.withdrawn_amount
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Ledger, Env, IntoVal};

    #[test]
    fn test_stream_lifecycle() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, VectorFlowContract);
        let client = VectorFlowContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);
        
        // Mock token deployment
        let token_admin = Address::generate(&env);
        let token_contract = env.register_stellar_asset_contract(token_admin.clone());
        let token_client = token::Client::new(&env, &token_contract);
        let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);
        
        token_admin_client.mint(&sender, &1000);

        let start_time = 1000;
        let stop_time = 2000;
        env.ledger().set_timestamp(start_time);

        // 1. Create Stream
        let stream_id = client.create_stream(&sender, &recipient, &token_contract, &1000, &start_time, &stop_time);
        assert_eq!(stream_id, 1);
        assert_eq!(token_client.balance(&contract_id), 1000);

        // 2. Advance time and verify claimable amount (halfway)
        env.ledger().set_timestamp(1500);
        let claimable = client.get_claimable_amount(&1);
        assert_eq!(claimable, 500);

        // 3. Withdraw part of claimable
        client.withdraw_from_stream(&1, &300);
        assert_eq!(token_client.balance(&recipient), 300);
        assert_eq!(token_client.balance(&contract_id), 700);

        // 4. Verify remaining claimable is now 200 (500 flowed - 300 withdrawn)
        assert_eq!(client.get_claimable_amount(&1), 200);

        // 5. Cancel stream at 1700 (70% flowed, 700 total flowed - 300 withdrawn = 400 paid to recipient, 300 returned to sender)
        env.ledger().set_timestamp(1700);
        client.cancel_stream(&1);

        assert_eq!(token_client.balance(&recipient), 700); // 300 from before + 400 from cancellation
        assert_eq!(token_client.balance(&sender), 300); // 300 returned (1000 total - 700 flowed)
        assert_eq!(token_client.balance(&contract_id), 0);
    }
}
