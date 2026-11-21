# Meeting Room Planner

## نصب و اجرا

```bash
npm install
```

### اجرای Mock API
```bash
npm run api
# http://localhost:3000
```

### اجرای پروژه Angular
```bash
npm start
# http://localhost:4200
```

### اجرای تستها
```bash
npm test
```

---

## معماری

```
src/app/
├── core/
│   ├── data-access/     # MeetingService, RoomService
│   ├── interceptors/    # delayInterceptor
│   └── models/          # models.ts (Room, Meeting, FreeSlot, NewMeeting)
├── shared/
│   ├── components/      # ConfirmDialogComponent, ToastComponent
│   └── utils/           # (legacy — utils moved to feature)
└── features/
    └── meetings/
        ├── components/  # MeetingFormComponent, MeetingCardComponent, RoomGroupComponent
        ├── pages/       # MeetingsListComponent, MeetingCreateComponent, MeetingEditComponent
        ├── utils/       # time.utils.ts, free-slots.ts, conflict.ts
        └── meetings.routes.ts
```

**اصل تفکیک:**
- `data-access`: فقط HTTP — هیچ منطق UI ندارد.
- `utils`: توابع خالص (pure functions) — هیچ وابستگی Angular ندارند و مستقیماً قابل Unit Test هستند.
- `components`: UI خالص — state از طریق `input/output` منتقل میشود.
- `pages`: ترکیب state، routing و data-access.

---

## مدیریت State

از **Signals** برای state محلی هر صفحه استفاده شده:
- `signal()` برای مقادیر قابل تغییر (loading, error, meetings, rooms, …)
- `computed()` برای مقادیر مشتقشده (filteredMeetings, groupedByRoom, hasAnyMeeting, capacityError, selectedRoom, timelineBlocks, formattedTotal, …)
- `toSignal()` از `@angular/core/rxjs-interop` برای تبدیل Observable فرم به Signal

هیچ global store وجود ندارد — هر صفحه state خودش را مدیریت میکند که برای این مقیاس کافی است.

---

## انتخاب روش فرم: Strictly Typed Reactive Forms

**دلیل انتخاب:**
- Angular 20 هنوز Signal Forms را در مرحله Developer Preview دارد و API آن ممکن است تغییر کند.
- Strictly Typed Reactive Forms بالغ، مستند و پشتیبانیشده است.
- Type safety کامل روی `form.controls` و `form.value` بدون نیاز به cast.
- Cross-field validation (endTime > startTime) و async conflict check به راحتی پیادهسازی میشود.

**مزایا در این پروژه:**
- `form.controls.X.hasError()` بدون `any`
- ترکیب آسان با `toSignal()` برای reactive UI

**محدودیتها:**
- Boilerplate بیشتر نسبت به Template-driven
- Signal Forms در آینده ممکن است ergonomics بهتری داشته باشد

---

## Featureهای جدید Angular استفادهشده

| Feature | محل استفاده |
|---|---|
| `signal()` / `computed()` | تمام صفحات و components |
| `input()` / `output()` (Signal Inputs) | MeetingFormComponent, MeetingCardComponent, RoomGroupComponent |
| `toSignal()` (RxJS-Signals Interop) | MeetingFormComponent |
| `@if` / `@for` با `track` | تمام templateها |
| Standalone Components | همه components |
| Functional HTTP Interceptor | delayInterceptor |
| Resolver | meetingResolver برای صفحه ویرایش |
| `CanDeactivateFn` Guard | unsavedChangesGuard |
| `withComponentInputBinding()` | app.config — resolver data به input میرسد |
| `takeUntilDestroyed()` | MeetingsListComponent |

---

## قابلیتهای انتخابی پیادهسازیشده

**Angular:**
- ✅ Signal Inputs (`input()` / `output()`)
- ✅ RxJS و Signals Interop (`toSignal`)
- ✅ Resolver برای صفحه ویرایش
- ✅ Route Guard (unsaved changes)

**محصول:**
- ✅ **Option A — Timeline:** نمودار زمانی بصری در هر room group
- ✅ **Option D — نمایش میزان استفاده:** progress bar درصد اشغال هر اتاق
- ✅ **Option E — هشدار خروج از فرم:** `CanDeactivateFn` guard

---

## مدیریت Loading و Error

- **Loading:** `signal<boolean>` در هر صفحه — spinner نمایش داده میشود
- **Error:** `signal<string | null>` — پیام خطا با دکمه Retry
- **Retry:** `Subject<void>` به نام `reload$` — با `reload$.next()` فراخوانی میشود
- **Delay مصنوعی:** `delayInterceptor` روی تمام درخواستها ۴۰۰-۷۰۰ms تأخیر اعمال میکند
- **Toast:** پس از حذف موفق/ناموفق نمایش داده میشود

---

## الگوریتم محاسبه Free Slot

**فایل:** `src/app/features/meetings/utils/free-slots.ts`

**مراحل:**
1. تبدیل هر جلسه به بازه `[startMin, endMin]` — زمانهای نامعتبر skip میشوند
2. Clip کردن بازهها به ساعات کاری `[480, 1080]`
3. مرتبسازی بر اساس زمان شروع — **O(n log n)**
4. Merge کردن بازههای همپوشان — **O(n)**
5. محاسبه فاصلههای خالی بین بازههای merged — **O(n)**

**پیچیدگی زمانی:** O(n log n) — dominated by sort  
**پیچیدگی فضایی:** O(n)

**مثال:**
```
ورودی: 09:00-10:30, 10:00-11:00, 10:45-12:00
merged: [09:00-12:00]
خروجی: [08:00-09:00, 12:00-18:00]
```

---

## فیلتر: Server-side vs Client-side

**تصمیم:** فیلتر date و roomId **server-side** (JSON Server query params)، فیلتر جستجوی متنی **client-side**.

**دلیل:**
- فیلتر date و room payload را کوچک نگه میدارد — مناسب برای رشد داده
- جستجوی متنی روی نتایج فعلی client-side انجام میشود — بدون round-trip اضافه
- این ترکیب بهترین تعادل بین performance و UX است

---

## Trade-offها

- **Global Store نداریم:** برای این مقیاس کافی است؛ در صورت رشد، یک `MeetingStore` signal-based اضافه میشود
- **Conflict check async است:** یک HTTP call اضافه هنگام submit — قابل بهینهسازی با cache
- **Resolver برای edit:** UX بهتر (loading قبل از ورود به صفحه) اما اگر API کند باشد کاربر منتظر میماند

---

## قسمتهای ناقص

- Room Suggestion (Option B) پیادهسازی نشد
- Undo حذف (Option C) پیادهسازی نشد
- تستهای E2E نوشته نشد

---

## در صورت داشتن زمان بیشتر

- پیادهسازی Option B (پیشنهاد اتاق) با استفاده از `calculateFreeSlots`
- اضافه کردن `linkedSignal` برای sync کردن date فرم با date فیلتر لیست
- بهبود accessibility با ARIA live regions دقیقتر
- اضافه کردن `httpResource` برای rooms (چون read-only است)
