# 06 — Performance, Lazy Loading & High-Traffic Scaling

This document details the loading state lifecycle, route code-splitting, list virtualization, image optimization, and high-traffic scalability strategies implemented in **Our School App**.

---

## 1. Loader & State Lifecycle Mechanics

The application enforces consistent feedback loops during asynchronous operations:

```text
               Screen Invocation / Route Change
                              │
                    Fetch Data Requested
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            Checking Cache        Network Request (Async)
                    │                   │
                    └─────────┬─────────┘
                              ▼
                     Is Loading Pending?
                    ┌─────────┴─────────┐
                    │ YES               │ NO
                    ▼                   ▼
           Render <Loading />      Data Arrived?
                                ┌───────┴───────┐
                                │ YES           │ NO / Error
                                ▼               ▼
                         Render Screen    Render <ErrorState />
                         Content Card     or <EmptyState />
```

### Loading State Primitives (`src/components/ui/states.tsx`):
- **`<Loading label="Loading..." />`**: Renders animated spinner with themed text label.
- **`<EmptyState icon="book-outline" message="No records found." />`**: Highlighting empty dataset state.
- **`<ErrorState message="Could not load records." onRetry={reload} />`**: Retry mechanism for network timeouts.

---

## 2. Route Code-Splitting & Lazy Loading

Expo Router v4 natively implements file-based route lazy loading:
1. **On-Demand Bundle Loading**: Screens inside `src/app/` are bundled into separate code-split chunks (`_expo/static/js/web/entry-...js`). Routes like `/teacher-import-students`, `/teacher-export`, or `/teacher-attendance` are only loaded when navigated to, reducing initial bundle size.
2. **Static Route Pre-rendering**: Static pages (`/about`, `/contact`, `/disclosure`) are pre-rendered into static HTML during build time (`npx expo export --platform web`).

---

## 3. List Virtualization & Image Optimization

### 3.1 Virtualized List Rendering
- All long scrolling feeds (Class Rosters, Attendance History, Homework List, News Feed, Gallery Albums) use virtualized list rendering (`FlatList` or `FlashList` pattern):
  - `initialNumToRender={10}`
  - `maxToRenderPerBatch={10}`
  - `windowSize={5}`
  - `removeClippedSubviews={Platform.OS === 'android'}`
  - `getItemLayout` for fixed-height items to eliminate layout measurement overhead.

### 3.2 Dynamic Image Optimization (`expo-image`)
- Uses `expo-image` with disk & memory caching instead of standard React Native `<Image>`:
  - `contentFit="cover"`
  - `transition={200}` fade animation
  - Automatic thumbnail resizing for gallery and homework attachments.

---

## 4. High-Traffic Production Scaling

To support 100,000+ active parents and teachers during peak hours (e.g. 8:00 AM attendance marking or result releases):

1. **Frontend Request Throttling & Deduplication**:
   - `useFetch` hook implements request deduplication and in-memory caching to prevent duplicate API calls on tab switches.
2. **Web Server Static Asset Distribution**:
   - Production static web assets (`dist/_expo/static`) are served with HTTP cache control headers (`Cache-Control: public, max-age=31536000, immutable`).
3. **Payload Compression**:
   - `gzip` and `brotli` compression enabled on server responses.
