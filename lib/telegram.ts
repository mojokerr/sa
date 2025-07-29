import { TelegramApi } from 'telegram';
import { StringSession } from 'telegram/sessions';

interface TelegramConfig {
  apiId: number;
  apiHash: string;
  botToken?: string;
  session?: string;
}

interface GroupInfo {
  id: string;
  title: string;
  username?: string;
  memberCount: number;
  type: 'group' | 'supergroup' | 'channel';
  isPrivate: boolean;
}

interface Member {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isBot: boolean;
  isPremium?: boolean;
  status: 'member' | 'admin' | 'owner' | 'banned' | 'left';
}

interface TransferProgress {
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  currentBatch: number;
  status: 'preparing' | 'transferring' | 'completed' | 'failed' | 'paused';
  errors: Array<{
    memberId: string;
    error: string;
    timestamp: Date;
  }>;
}

export class TelegramService {
  private client: TelegramApi | null = null;
  private config: TelegramConfig;

  constructor(config: TelegramConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      const session = new StringSession(this.config.session || '');
      this.client = new TelegramApi(session, this.config.apiId, this.config.apiHash, {
        connectionRetries: 5,
      });

      await this.client.start({
        botAuthToken: this.config.botToken,
      });

      return this.client.connected;
    } catch (error) {
      console.error('Telegram connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  async getGroupInfo(groupLink: string): Promise<GroupInfo | null> {
    if (!this.client) throw new Error('Telegram client not connected');

    try {
      const groupUsername = this.extractGroupUsername(groupLink);
      const entity = await this.client.getEntity(groupUsername);
      
      if (!entity) return null;

      const participantsCount = await this.client.invoke(
        new (await import('telegram/tl')).Api.channels.GetFullChannel({
          channel: entity,
        })
      );

      return {
        id: entity.id.toString(),
        title: entity.title || '',
        username: entity.username,
        memberCount: participantsCount.fullChat.participantsCount || 0,
        type: entity.className === 'Channel' ? 'channel' : 'supergroup',
        isPrivate: !entity.username,
      };
    } catch (error) {
      console.error('Failed to get group info:', error);
      return null;
    }
  }

  async getGroupMembers(groupLink: string, limit: number = 10000): Promise<Member[]> {
    if (!this.client) throw new Error('Telegram client not connected');

    try {
      const groupUsername = this.extractGroupUsername(groupLink);
      const entity = await this.client.getEntity(groupUsername);
      
      const participants = await this.client.getParticipants(entity, {
        limit,
        filter: new (await import('telegram/tl')).Api.ChannelParticipantsRecent(),
      });

      return participants.map((participant: any) => ({
        id: participant.id.toString(),
        username: participant.username,
        firstName: participant.firstName,
        lastName: participant.lastName,
        phone: participant.phone,
        isBot: participant.bot || false,
        isPremium: participant.premium || false,
        status: 'member',
      }));
    } catch (error) {
      console.error('Failed to get group members:', error);
      return [];
    }
  }

  async transferMembers(
    sourceGroupLink: string,
    targetGroupLink: string,
    memberLimit: number,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<TransferProgress> {
    if (!this.client) throw new Error('Telegram client not connected');

    const progress: TransferProgress = {
      total: memberLimit,
      completed: 0,
      failed: 0,
      skipped: 0,
      currentBatch: 0,
      status: 'preparing',
      errors: [],
    };

    try {
      // Get source group members
      progress.status = 'preparing';
      onProgress?.(progress);

      const sourceMembers = await this.getGroupMembers(sourceGroupLink, memberLimit);
      if (sourceMembers.length === 0) {
        throw new Error('No members found in source group');
      }

      const targetGroupUsername = this.extractGroupUsername(targetGroupLink);
      const targetEntity = await this.client.getEntity(targetGroupUsername);

      progress.total = Math.min(sourceMembers.length, memberLimit);
      progress.status = 'transferring';
      onProgress?.(progress);

      // Transfer members in batches
      const batchSize = 10; // Telegram rate limits
      const delay = 2000; // 2 seconds between batches

      for (let i = 0; i < progress.total; i += batchSize) {
        const batch = sourceMembers.slice(i, i + batchSize);
        progress.currentBatch = Math.floor(i / batchSize) + 1;

        for (const member of batch) {
          try {
            // Skip bots and already failed members
            if (member.isBot) {
              progress.skipped++;
              continue;
            }

            // Add member to target group
            await this.client.invoke(
              new (await import('telegram/tl')).Api.channels.InviteToChannel({
                channel: targetEntity,
                users: [member.id],
              })
            );

            progress.completed++;
            await this.delay(100); // Small delay between individual invites

          } catch (error) {
            progress.failed++;
            progress.errors.push({
              memberId: member.id,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
            });
          }
        }

        onProgress?.(progress);

        // Wait between batches to avoid rate limiting
        if (i + batchSize < progress.total) {
          await this.delay(delay);
        }
      }

      progress.status = progress.failed === 0 ? 'completed' : 'completed';
      onProgress?.(progress);

      return progress;

    } catch (error) {
      progress.status = 'failed';
      progress.errors.push({
        memberId: 'system',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
      onProgress?.(progress);
      throw error;
    }
  }

  async addMemberToGroup(groupLink: string, userId: string): Promise<boolean> {
    if (!this.client) throw new Error('Telegram client not connected');

    try {
      const groupUsername = this.extractGroupUsername(groupLink);
      const groupEntity = await this.client.getEntity(groupUsername);
      const userEntity = await this.client.getEntity(userId);

      await this.client.invoke(
        new (await import('telegram/tl')).Api.channels.InviteToChannel({
          channel: groupEntity,
          users: [userEntity],
        })
      );

      return true;
    } catch (error) {
      console.error('Failed to add member:', error);
      return false;
    }
  }

  async validateGroupAccess(groupLink: string): Promise<{
    canAccess: boolean;
    canInvite: boolean;
    memberCount: number;
    error?: string;
  }> {
    try {
      const groupInfo = await this.getGroupInfo(groupLink);
      
      if (!groupInfo) {
        return {
          canAccess: false,
          canInvite: false,
          memberCount: 0,
          error: 'Group not found or not accessible',
        };
      }

      // Check if we have admin rights
      const groupUsername = this.extractGroupUsername(groupLink);
      const entity = await this.client!.getEntity(groupUsername);
      
      const participant = await this.client!.invoke(
        new (await import('telegram/tl')).Api.channels.GetParticipant({
          channel: entity,
          participant: 'me',
        })
      );

      const canInvite = participant.participant.className === 'ChannelParticipantAdmin' ||
                       participant.participant.className === 'ChannelParticipantCreator';

      return {
        canAccess: true,
        canInvite,
        memberCount: groupInfo.memberCount,
      };

    } catch (error) {
      return {
        canAccess: false,
        canInvite: false,
        memberCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private extractGroupUsername(groupLink: string): string {
    const match = groupLink.match(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/);
    if (!match) throw new Error('Invalid Telegram group link');
    return match[1];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Rate limiting helper
  private async withRateLimit<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (lastError.message.includes('FLOOD_WAIT')) {
          const waitTime = this.extractFloodWaitTime(lastError.message);
          console.log(`Rate limited. Waiting ${waitTime} seconds...`);
          await this.delay(waitTime * 1000);
          continue;
        }
        
        throw lastError;
      }
    }
    
    throw lastError;
  }

  private extractFloodWaitTime(errorMessage: string): number {
    const match = errorMessage.match(/FLOOD_WAIT_(\d+)/);
    return match ? parseInt(match[1]) : 60; // Default to 60 seconds
  }
}

// Helper function to create telegram service instance
export function createTelegramService(config: TelegramConfig): TelegramService {
  return new TelegramService(config);
}

// Validation helpers
export function validateTelegramGroupLink(link: string): boolean {
  const regex = /^https?:\/\/(t\.me|telegram\.me)\/[a-zA-Z0-9_]+$/;
  return regex.test(link);
}

export function extractGroupNameFromLink(link: string): string {
  const match = link.match(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/);
  return match ? match[1] : '';
}

// Types export
export type {
  TelegramConfig,
  GroupInfo,
  Member,
  TransferProgress,
};
