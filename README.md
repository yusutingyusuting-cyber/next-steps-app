# next-steps-app

在 Claude 每轮回答结束后，于输入框上方给出最多三条“下一步”建议。在终端和 Claude Code 桌面 App 中都能显示。

```
next
  1  运行完整测试，看看登录修复有没有影响别的地方
  2  /code-review high
  3  把同样的修复也用到设置页
  0  关闭
```

- 在空输入框里按 `1`、`2`、`3`，或者直接点击，对应建议会作为草稿填入输入框，你可以修改后再按回车发送。按 `0` 关闭。
- 第一条建议同时会显示为输入框里的灰色提示，按 Tab 即可采用。
- 如果某个 skill 或斜杠命令就是自然的下一步，建议会直接写成 `/命令 参数`，命令部分以橙色加粗显示。会话里不存在的命令会被过滤掉。
- 插件不会替你自动发送任何内容。

本插件改编自 Thariq Shihipar 的 [next-steps](https://github.com/anthropics/claude-plugins-community/tree/main/next-steps) 插件（MIT 许可）。改动有三处：面板状态保存在 `$.state` 中，热重载后不会丢失；建议中的 `/命令` 会高亮显示；界面文字改为中文。

## 安装

在终端版 Claude Code 中运行：

```
/plugin install next-steps-app --marketplace yusutingyusuting-cyber/next-steps-app
```

也可以在命令行中运行：

```bash
claude plugin marketplace add yusutingyusuting-cyber/next-steps-app
```

```bash
claude plugin install next-steps-app@next-steps-app --scope user
```

## 在云端会话中使用

云端会话不会读取你电脑上的设置。如果希望云端会话也加载本插件，需要把下面的内容写入你项目仓库的 `.claude/settings.json` 并提交：

```json
{
  "extraKnownMarketplaces": {
    "next-steps-app": {
      "source": { "source": "github", "repo": "yusutingyusuting-cyber/next-steps-app" }
    }
  },
  "enabledPlugins": {
    "next-steps-app@next-steps-app": true
  }
}
```

## 显示位置

| 位置 | 能否显示 |
| --- | --- |
| 终端 | 能 |
| Claude Code 桌面 App | 能 |
| 手机或网页上的远程控制、Claude 普通聊天 | 不能：这些界面不绘制插件内容 |

## 选项

| 选项 | 默认值 | 作用 |
| --- | --- | --- |
| `minAnswerChars` | `80` | 回答短于这个字数时不给出建议 |
| `suggestSkills` | `true` | 把会话中可用的 skill 和斜杠命令告诉建议生成器 |
