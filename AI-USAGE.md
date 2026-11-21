# AI-USAGE.md

## ابزارهای استفادهشده

- **Amazon Q Developer** (IDE plugin)

---

## بخشهایی که از AI کمک گرفته شده

- Scaffolding ساختار اولیه پروژه (models, services, interceptor)
- پیادهسازی الگوریتم `calculateFreeSlots` و `mergeIntervals`
- نوشتن تستهای unit برای utils و service
- نوشتن template های HTML با Semantic markup
- نوشتن SCSS با CSS custom properties

---

## نمونه Promptهای اصلی

```
پیادهسازی کامل Angular Meeting Room Planner با:
- Strictly Typed Reactive Forms
- Signal Inputs/Outputs
- Resolver برای edit page
- CanDeactivateFn guard
- Timeline visualization
- Free slot algorithm با O(n log n)
```

---

## تغییراتی که پس از دریافت خروجی AI انجام شد

- اصلاح import paths (از `'../models'` به `'../models/models'`)
- حذف تکرار `.btn` و `.spinner` از component scss ها و انتقال به `styles.scss`
- اصلاح `unsavedChangesGuard` تا با `MeetingEditComponent` (نه `MeetingFormComponent`) کار کند
- اصلاح resolver برای استفاده مستقیم (نه lazy) در routes
- بهبود conflict check برای مدیریت `ignoreId` در edit mode

---

## خطاها یا پیشنهادهای نامناسب مشاهده و اصلاحشده

- AI ابتدا `MeetingFormData` را به عنوان type جداگانه تعریف کرد که با `NewMeeting` در `models.ts` تداخل داشت — یکی شدند
- AI ابتدا `canDeactivate` را با lazy import تعریف کرد که با Angular router سازگار نبود — به import مستقیم تغییر یافت
- AI ابتدا `btn` styles را در هر component تکرار کرد — به global styles منتقل شد
