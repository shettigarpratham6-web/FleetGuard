import type { Request, Response } from 'express';
import maintenanceService from '../services/maintenanceService';

export const getServiceQueue = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const queue = await maintenanceService.getServiceQueue();

    return res.status(200).json({
      success: true,
      count: queue.length,
      data: queue
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export default { getServiceQueue };
