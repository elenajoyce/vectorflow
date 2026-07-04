import { Router, Request, Response } from 'express';
import { Persistence } from '../persistence/index.js';

export const routes: Router = Router();

// List all streams
routes.get('/streams', (req: Request, res: Response) => {
  try {
    const list = Persistence.listStreams();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get stream detail with real-time accrued calculations
routes.get('/streams/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const stream = Persistence.getStream(id);
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Real-time server projection of continuous stream value
    const currentTime = Math.floor(Date.now() / 1000);
    let accrued = '0';

    if (currentTime > stream.start_time) {
      if (currentTime >= stream.stop_time) {
        accrued = stream.total_amount;
      } else {
        const total = BigInt(stream.total_amount);
        const duration = BigInt(stream.stop_time - stream.start_time);
        const elapsed = BigInt(currentTime - stream.start_time);
        accrued = ((total * elapsed) / duration).toString();
      }
    }

    res.json({
      ...stream,
      projectedAccrued: accrued,
      projectedRemaining: (BigInt(stream.total_amount) - BigInt(accrued)).toString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
