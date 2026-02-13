import { input, confirm } from '@inquirer/prompts';
import { printInfo, printWarning } from '../utils/display.js';
import { createSuggestionProvider } from './suggestionEngine.js';

export interface ApprovalResult {
  approved: boolean;
  feedback?: string;
  improvements?: string[];
}

export interface ApprovalOptions {
  /** The document content being reviewed, used for generating improvement suggestions */
  content?: string;
}

export async function requestApproval(
  message: string,
  options: ApprovalOptions = {},
): Promise<ApprovalResult> {
  printInfo(message);
  const approved = await confirm({ message: '是否批准？', default: true });

  if (!approved) {
    const feedback = await input({
      message: '请输入修改意见（可选）：',
      default: '',
    });
    printWarning('已驳回。');

    let improvements: string[] | undefined;
    if (feedback && options.content) {
      const provider = createSuggestionProvider();
      improvements = provider.suggestImprovements(options.content, feedback);
      if (improvements.length > 0) {
        printInfo('改进建议：');
        for (const tip of improvements) {
          printInfo(`  → ${tip}`);
        }
      }
    }

    return {
      approved: false,
      feedback: feedback || undefined,
      improvements,
    };
  }

  return { approved: true };
}

export async function requestConfirmation(message: string): Promise<boolean> {
  return confirm({ message, default: true });
}
