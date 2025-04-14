const AuditLog = require('../models/auditLog.model');

// Service for audit logging
class AuditService {
  // Log user actions
  async logAction(user, action, details, req) {
    try {
      // Create new audit log entry
      const auditLog = new AuditLog({
        user: user._id,
        action,
        details: this.maskSensitiveData(details),
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      
      // Save audit log
      await auditLog.save();
      
      return auditLog;
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw error to prevent disrupting main application flow
    }
  }
  
  // Mask sensitive data in audit logs
  maskSensitiveData(details) {
    if (!details) return {};
    
    // Create a deep copy to avoid modifying the original object
    const maskedDetails = JSON.parse(JSON.stringify(details));
    
    // Mask password fields if present
    if (maskedDetails.password) {
      maskedDetails.password = '********';
    }
    
    if (maskedDetails.currentPassword) {
      maskedDetails.currentPassword = '********';
    }
    
    if (maskedDetails.newPassword) {
      maskedDetails.newPassword = '********';
    }
    
    // Mask sensitive data in query results if present
    if (maskedDetails.results && Array.isArray(maskedDetails.results)) {
      maskedDetails.results = maskedDetails.results.map(result => {
        // Create a copy of the result
        const maskedResult = { ...result };
        
        // Mask potentially sensitive fields in log messages
        if (maskedResult.message && typeof maskedResult.message === 'string') {
          // Mask credit card numbers
          maskedResult.message = maskedResult.message.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '****-****-****-****');
          
          // Mask email addresses
          maskedResult.message = maskedResult.message.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '****@****.***');
          
          // Mask IP addresses
          maskedResult.message = maskedResult.message.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '**.***.***.**');
        }
        
        return maskedResult;
      });
    }
    
    return maskedDetails;
  }
  
  // Get audit logs for a specific user
  async getUserLogs(userId, limit = 100) {
    try {
      const logs = await AuditLog.find({ user: userId })
        .sort({ timestamp: -1 })
        .limit(limit);
      
      return logs;
    } catch (error) {
      console.error('Error fetching user audit logs:', error);
      throw new Error('Failed to fetch audit logs');
    }
  }
  
  // Get all audit logs (admin only)
  async getAllLogs(limit = 100, skip = 0) {
    try {
      const logs = await AuditLog.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username role');
      
      const total = await AuditLog.countDocuments();
      
      return {
        logs,
        total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching all audit logs:', error);
      throw new Error('Failed to fetch audit logs');
    }
  }
}

module.exports = new AuditService();
