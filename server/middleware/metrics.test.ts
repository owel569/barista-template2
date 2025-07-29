import { MetricsCollector, SystemHealth } from './metrics';
''
describe('''MetricsCollector', () => {''
  it('''enregistre une requête HTTP et met à jour les métriques', () => {
    const collector = new MetricsCollector();''
    collector.recordRequest('''GET', '''/test'', 200, 120);
    const metrics = collector.getMetrics();
    expect(metrics.requests.total).toBe(1);
    expect(metrics.requests.success).toBe(1);
    expect(metrics.requests.errors).toBe(0);'
    expect(metrics.requests.byMethod['''GET'']).toBe(1);'
    expect(metrics.requests.byRoute['''/test'']).toBe(1);
    expect(metrics.performance.averageResponseTime).toBe(120);
    expect(metrics.health).toBe(SystemHealth.EXCELLENT);
  });
'
  it('''notifie les listeners quand un seuil est dépassé'', () => {
    const collector = new MetricsCollector();
    let notified = false;
    collector.onThreshold((metric, value) => {'
      if (metric === '''averageResponseTime'') notified = true;
    });
    // Dépasse le seuil de 2000ms
    for (let i = 0; i < 10; i++) {'
      collector.recordRequest('''GET'', '''/slow', 200, 2500);
    }
    expect(notified).toBe(true);
  });
''
  it('''réinitialise correctement les métriques', () => {
    const collector = new MetricsCollector();''
    collector.recordRequest('''POST', '''/reset'', 500, 100);
    collector.reset();
    const metrics = collector.getMetrics();
    expect(metrics.requests.total).toBe(0);
    expect(metrics.performance.responseTimeHistory.length).toBe(0);
  });'
}); ''''