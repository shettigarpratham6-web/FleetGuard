const maintenanceService = require('../services/maintenanceService');

import { Request, Response } from 'express';

exports.getServiceQueue = async (
  req: Request,
  res: Response
) => {
  try {
    const queue = await maintenanceService.getServiceQueue();

    res.status(200).json({
      success: true,
      count: queue.length,
      data: queue
    });

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred';

    res.status(500).json({
      success: false,
      message
    });
  }
};