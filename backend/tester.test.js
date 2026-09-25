const db = require('./src/config/db');
const auditController = require('./src/controllers/auditController');
const branchController = require('./src/controllers/branchController');

// Mock database module with Jest
jest.mock('./src/config/db', () => ({
  query: jest.fn()
}));

// Helper to create mock response object with Jest spied functions
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Audit Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAuditLogs - should return 200 and list of audit logs', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, action: 'LOGIN' }] });
    const req = { query: {} };
    const res = mockRes();

    await auditController.getAuditLogs(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ auditLogs: [{ id: 1, action: 'LOGIN' }] });
  });

  test('getAuditLogsByEntity - should return 200 and entity logs', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 2, entity_type: 'VEHICLE' }] });
    const req = { params: { entityType: 'VEHICLE', entityId: '1' } };
    const res = mockRes();

    await auditController.getAuditLogsByEntity(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ auditLogs: [{ id: 2, entity_type: 'VEHICLE' }] });
  });
});

describe('Branch Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createBranch - should return 400 when branch_name is missing', async () => {
    const req = { body: {} };
    const res = mockRes();

    await branchController.createBranch(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Branch name is required.' });
  });

  test('createBranch - should return 201 when branch is created successfully', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 10, branch_name: 'Main Branch' }] });
    const req = { body: { branch_name: 'Main Branch' } };
    const res = mockRes();

    await branchController.createBranch(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Branch created successfully',
      branch: { id: 10, branch_name: 'Main Branch' }
    });
  });

  test('getAllBranches - should return 200 and list of branches', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, branch_name: 'HQ Branch' }] });
    const req = { query: {} };
    const res = mockRes();

    await branchController.getAllBranches(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ branches: [{ id: 1, branch_name: 'HQ Branch' }] });
  });
});
