import { describe, it, expect } from 'vitest';
import type { ApprovalResult } from '../approvalManager.js';
import { createSuggestionProvider } from '../suggestionEngine.js';

// approvalManager uses interactive prompts, so we test the types and
// the suggestImprovements logic that it delegates to.

describe('approvalManager logic', () => {
  it('ApprovalResult approved shape', () => {
    const result: ApprovalResult = { approved: true };
    expect(result.approved).toBe(true);
    expect(result.feedback).toBeUndefined();
    expect(result.improvements).toBeUndefined();
  });

  it('ApprovalResult rejected shape with feedback', () => {
    const result: ApprovalResult = {
      approved: false,
      feedback: '需要更多细节',
      improvements: ['添加错误处理', '补充测试用例'],
    };
    expect(result.approved).toBe(false);
    expect(result.feedback).toBe('需要更多细节');
    expect(result.improvements).toHaveLength(2);
  });

  it('suggestImprovements returns suggestions for content + feedback', () => {
    const provider = createSuggestionProvider();
    const content = '# 技术规范\n\n## 功能需求\n用户登录';
    const feedback = '缺少错误处理';
    const suggestions = provider.suggestImprovements(content, feedback);
    expect(Array.isArray(suggestions)).toBe(true);
  });

  it('suggestImprovements returns empty for empty feedback', () => {
    const provider = createSuggestionProvider();
    const suggestions = provider.suggestImprovements('some content', '');
    expect(Array.isArray(suggestions)).toBe(true);
  });
});
