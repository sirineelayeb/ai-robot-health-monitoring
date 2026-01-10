export interface Alert {
  id: string;
  robot_id: string;
  timestamp: string;
  status: "CRITICAL" | "WARNING";
  issues: AlertIssue[];
  metrics: AlertMetrics;
}

export interface AlertIssue {
  message: string;
  severity: "CRITICAL" | "WARNING";
}

export interface AlertMetrics {
  battery_level: number;
  temperature: number;
  cpu_load: number;
  velocity: number;
  motor_current: number;
}

// Configuration
const API_BASE_URL = 'http://localhost:3000';

// Transform helpers
// In your transformToAlerts function, add:
const transformToAlerts = (backendData: any): Alert[] => {
  const alertsArray = backendData.alerts || backendData.data || backendData;
  if (!Array.isArray(alertsArray)) return [];
  
  return alertsArray.map((item: any, index: number) => {
    console.log(`\n=== Processing Alert ${index + 1} ===`);
    console.log('Raw item:', JSON.stringify(item, null, 2));
    
    const metrics = extractMetrics(item);
    const issues = extractIssues(item);
    
    const alert = {
      id: item._id || `alert-${Date.now()}-${Math.random()}`,
      robot_id: item.robot_id || "robot_001",
      timestamp: item.timestamp || new Date().toISOString(),
      status: item.status === "CRITICAL" ? "CRITICAL" : "WARNING",
      issues,
      metrics
    };
    
    console.log('Created alert:', alert);
    console.log(`=== End Alert ${index + 1} ===\n`);
    
    return alert;
  });
};

const extractIssues = (item: any): AlertIssue[] => {
  const issues: AlertIssue[] = [];
  
  // Extract from issues array
  if (item.issues?.length > 0) {
    issues.push(...item.issues.map((issue: any) => ({
      message: issue.message || "Issue detected",
      severity: issue.severity || "WARNING"
    })));
  }
  
  // Add ML anomaly
  if (item.ml_anomaly) {
    const anomalyType = item.ml_anomaly_type || item.anomaly_type || "Anomaly";
    issues.push({
      message: `AI detected: ${anomalyType}`,
      severity: "CRITICAL"
    });
  }
  
  // Fallback
  if (issues.length === 0) {
    issues.push({
      message: item.status === "CRITICAL" ? "Critical alert detected" : "Warning alert detected",
      severity: item.status === "CRITICAL" ? "CRITICAL" : "WARNING"
    });
  }
  
  return issues;
};

const extractMetrics = (item: any): AlertMetrics => {
  console.log('Extracting metrics from item:', item);
  
  // Initialize with zeros
  const metrics: AlertMetrics = {
    battery_level: 0,
    temperature: 0,
    cpu_load: 0,
    velocity: 0,
    motor_current: 0
  };
  
  // Track if we found any metric
  let foundAnyMetric = false;
  
  // Extract from issues array
  if (item.issues?.length > 0) {
    console.log(`Processing ${item.issues.length} issues:`);
    
    item.issues.forEach((issue: any, index: number) => {
      const value = issue.value || 0;
      const metric = issue.metric;
      
      console.log(`  Issue ${index + 1}: metric="${metric}", value=${value}, severity="${issue.severity}"`);
      
      // Use switch to handle different metric names
      switch (metric) {
        case 'pc_cpu_load':
        case 'cpu_load':
          metrics.cpu_load = value;
          foundAnyMetric = true;
          break;
          
        case 'velocity':
        case 'speed':
          metrics.velocity = value;
          foundAnyMetric = true;
          break;
          
        case 'motor_current':
        case 'current':
          metrics.motor_current = value;
          foundAnyMetric = true;
          break;
          
        case 'battery_level':
        case 'battery':
          metrics.battery_level = value;
          foundAnyMetric = true;
          break;
          
        case 'temperature':
        case 'temp':
          metrics.temperature = value;
          foundAnyMetric = true;
          break;
          
        default:
          console.log(`  Unknown metric: ${metric}`);
      }
    });
  }
  
  // Log what we extracted
  console.log('Extracted metrics:', metrics);
  console.log('Found any metric?', foundAnyMetric);
  
  return metrics;
};

// Mock data for fallback
const getMockAlerts = (count: number): Alert[] => {
  return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    id: `mock-${Date.now()}-${i}`,
    robot_id: "robot_001",
    timestamp: new Date(Date.now() - i * 60000).toISOString(),
    status: i % 3 === 0 ? "CRITICAL" : "WARNING",
    issues: [
      {
        message: i % 3 === 0 
          ? `Critical PC CPU load: ${95 + i}%` 
          : `High PC CPU load: ${85 + i}%`,
        severity: i % 3 === 0 ? "CRITICAL" : "WARNING"
      }
    ],
    metrics: {
      battery_level: 35 + i * 5,
      temperature: 50 + i * 3,
      cpu_load: 85 + i * 2,
      velocity: 0.5 + i * 0.5,
      motor_current: 8 + i * 1.5
    }
  }));
};

// API Functions - USING FULL URL
export const fetchRecentAlerts = async (
  robotId: string = "robot_001",
  limit: number = 20
): Promise<Alert[]> => {
  try {
    // Use FULL URL
    const url = `${API_BASE_URL}/api/alerts/recent?limit=${limit}`;
    console.log('📡 Fetching from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ API Success! Data received:', {
      success: data.success,
      count: data.count,
      alertsCount: data.alerts?.length
    });
    
    return transformToAlerts(data);
    
  } catch (error) {
    console.error('❌ API call failed:', error);
    console.log('🔄 Using mock data instead');
    return getMockAlerts(limit);
  }
};

export const fetchRobotAlerts = async (
  robotId: string = "robot_001", 
  limit: number = 50
): Promise<Alert[]> => {
  try {
    const url = `${API_BASE_URL}/api/robots/${robotId}/alerts?limit=${limit}`;
    console.log('📡 Fetching robot alerts from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return transformToAlerts(data);
    
  } catch (error) {
    console.error('❌ Robot alerts failed:', error);
    // Fallback to recent alerts
    return await fetchRecentAlerts(robotId, limit);
  }
};

export const fetchAlertStats = async (
  robotId: string = "robot_001"
): Promise<{
  critical: number;
  warning: number;
  total: number;
}> => {
  try {
    const alerts = await fetchRecentAlerts(robotId, 100);
    return {
      critical: alerts.filter(a => a.status === "CRITICAL").length,
      warning: alerts.filter(a => a.status === "WARNING").length,
      total: alerts.length
    };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return { critical: 2, warning: 3, total: 5 };
  }
};