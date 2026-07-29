const maintenanceService = require('../services/maintenanceService');

exports.getServiceQueue = async (req, res) => {
    try {
        const queue = await maintenanceService.getServiceQueue();

        res.status(200).json({
            success: true,
            count: queue.length,
            data: queue
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};