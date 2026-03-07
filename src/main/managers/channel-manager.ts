import { SettingsManager, ChannelConfig } from './settings-manager'

export class ChannelManager {
  private settingsManager: SettingsManager

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager
  }

  async getChannelConfig(): Promise<ChannelConfig> {
    const config = await this.settingsManager.read()
    return config.channel
  }

  async updateChannelConfig(channelConfig: ChannelConfig): Promise<void> {
    const config = await this.settingsManager.read()
    config.channel = channelConfig
    await this.settingsManager.update(config)
  }

  async getChannel(channelId: string): Promise<unknown> {
    const config = await this.settingsManager.read()
    return config.channel[channelId]
  }

  async setChannel(channelId: string, configData: unknown): Promise<void> {
    const config = await this.settingsManager.read()
    if (!config.channel) {
      // @ts-ignore: Allow assigning empty object if channel is missing
      config.channel = {}
    }
    config.channel[channelId] = configData
    await this.settingsManager.update(config)
  }
}
