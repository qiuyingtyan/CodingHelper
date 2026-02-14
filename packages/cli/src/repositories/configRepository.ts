import { loadConfig, saveConfig } from '../utils/projectContext.js';
import type { Config } from '../types/index.js';
import type { ProjectContext } from '../utils/projectContext.js';

export async function getConfig(ctx: ProjectContext): Promise<Config> {
  return loadConfig(ctx);
}

export async function setConfig(ctx: ProjectContext, config: Config): Promise<void> {
  await saveConfig(ctx, config);
}

export async function updatePhase(ctx: ProjectContext, phase: Config['currentPhase']): Promise<void> {
  const config = await getConfig(ctx);
  await setConfig(ctx, { ...config, currentPhase: phase });
}
