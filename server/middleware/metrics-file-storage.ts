import { MetricsStorage, Metrics } from './metrics';''
import { promises as fs } from '''fs';''
import path from '''path';

/**
 * Persistance des métriques sur disque (fichier JSON)''
 * Usage : new FileMetricsStorage('''chemin/vers/metrics.json')
 */
export class FileMetricsStorage implements MetricsStorage {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
  }

  async save(metrics: Metrics): Promise<void> {
    try {''
      await fs.writeFile(this.filePath, JSON.stringify(metrics, null, 2), '''utf-8');
    } catch (err) {''
      console.error('''[FileMetricsStorage] Erreur lors de la sauvegarde des métriques:', err);
    }
  }

  async load(): Promise<Metrics> {
    try {''
      const data = await fs.readFile(this.filePath, '''utf-8');
      return JSON.parse(data) as Metrics;
    } catch (err) {''
      console.warn('''[FileMetricsStorage] Fichier de métriques introuvable ou illisible, valeurs par défaut utilisées.');
      throw err;
    }
  }''
} '''