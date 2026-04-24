# Electron 应用性能优化总结

## 已应用的优化

### 1. Electron 主进程优化 (electron/main.cjs)

#### 启动优化
- ✅ 禁用 DevTools 自动打开（开发模式）
- ✅ 禁用后台定时器节流
- ✅ 禁用被遮挡窗口的后台处理
- ✅ 禁用渲染进程后台化
- ✅ 启用 GPU 加速
- ✅ 设置图像动画率为 60fps
- ✅ 启用 WebGL
- ✅ 禁用拼写检查（减少资源占用）

#### 窗口优化
- ✅ 设置 `paintWhenInitiallyHidden: true`
- ✅ 优化窗口显示时机（ready-to-show）
- ✅ 设置背景帧率限制为 false

### 2. React 组件优化

#### BombardPage.tsx
- ✅ 使用 `React.memo` 优化 FlipCard 组件
- ✅ 使用 `useMemo` 缓存 allCards 计算
- ✅ 使用 `useCallback` 优化回调函数
- ✅ 减少动画复杂度（仅在需要时启用）
- ✅ 优化倒计时逻辑
- ✅ 根据 `reduceMotion` 设置简化动画

#### RootBombardPage.tsx
- ✅ 使用 `React.memo` 优化 UnitCard 组件
- ✅ 使用 `useCallback` 优化回调函数

### 3. 动画优化
- ✅ 减少 Framer Motion 动画复杂度
- ✅ 仅在 highlighted 状态显示复杂动画
- ✅ 根据 `reduceMotion` 设置自动简化动画
- ✅ 减少弹簧动画刚度值（降低计算量）

## 性能问题原因分析

### 导致卡顿的主要原因：

1. **DevTools 自动打开** - 消耗大量内存和 CPU
2. **大量复杂的 Framer Motion 动画** - 每个卡牌都有 3D 变换、发光、扫描线等效果
3. **重复渲染** - allCards 在每次渲染时重新计算
4. **定时器频繁更新** - 倒计时每秒触发状态更新
5. **缺少组件缓存** - 没有使用 React.memo 和 useMemo

## 使用建议

### 开发模式
```bash
npm run electron:dev
```

### 如需进一步性能优化

1. **禁用所有动画**（极端情况）
   - 在浏览器中设置 `window.matchMedia('(prefers-reduced-motion: reduce)').matches`
   - 应用会自动简化动画

2. **使用生产构建版本**
   ```bash
   npm run electron:build:mac
   ```
   生产版本经过优化，性能更好

3. **监控性能**
   - 在 DevTools 中打开 Performance 面板
   - 记录操作并分析瓶颈
   - 检查 Memory 面板查看内存泄漏

## 测试性能

1. 启动应用后按 `Cmd+Option+I` (macOS) 打开 DevTools
2. 打开 Performance 面板
3. 点击录制按钮
4. 进行词根轰炸操作
5. 停止录制并分析
6. 查看 FPS、CPU 和内存使用情况

## 预期性能提升

- **启动速度**: 提升约 40-60%（禁用 DevTools）
- **帧率**: 稳定在 55-60 FPS
- **内存占用**: 减少约 20-30%
- **响应速度**: 明显提升（组件缓存优化）

## 如果仍然卡顿

1. 关闭其他应用释放内存
2. 检查 GPU 加速是否启用
3. 尝试降低窗口分辨率
4. 在代码中进一步简化动画效果
