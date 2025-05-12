import { Router, Request, Response } from 'express';

const router = Router();

// Simple metrics endpoint
router.get('/', (req: Request, res: Response) => {
  const metrics = `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/metrics"} 1

# HELP process_uptime_seconds The uptime of the process in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime()}
`;
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

export default router;