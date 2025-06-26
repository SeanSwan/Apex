# DATA FLOW DEBUGGING GUIDE

## FIXES IMPLEMENTED

### 1. **DataVisualizationPanel.tsx**
- ✅ Removed dual data paths (props vs context)
- ✅ Made context the single source of truth
- ✅ Fixed chart generation to update BOTH prop callback AND context
- ✅ Simplified data change detection to prevent infinite loops
- ✅ Added proper debouncing and cooldown

### 2. **ReportDataContext.tsx**
- ✅ Simplified daily reports analysis with debouncing
- ✅ Fixed auto-sync for client changes
- ✅ Removed complex comparison logic that caused loops

### 3. **ReportBuilder.tsx (ReportDataUpdater)**
- ✅ Added proper debouncing for data sync
- ✅ Removed setter functions from useEffect dependencies
- ✅ Added chart generation triggers for viz tab

### 4. **EnhancedPreviewPanel.tsx**
- ✅ Enhanced chart data validation
- ✅ Better error messages and loading states
- ✅ Improved chart image handling

## EXPECTED DATA FLOW

```
1. User edits metrics in PropertyInfoPanel
   ↓
2. ReportDataUpdater syncs to context (debounced)
   ↓
3. DataVisualizationPanel detects metrics change
   ↓
4. Chart generation triggered with dual updates:
   - setChartDataURL (prop callback)
   - contextSetChartDataURL (context)
   ↓
5. EnhancedPreviewPanel receives chart data from context
   ↓
6. Chart displays in preview
```

## TESTING STEPS

1. **Start the application**
2. **Select a client** (Bell Warner Center)
3. **Navigate to Info tab** - Edit some metrics
4. **Navigate to Visualize tab** - Should generate charts automatically
5. **Navigate to Preview tab** - Charts should appear

## DEBUG CONSOLE MESSAGES

Look for these messages in the browser console:

- `📊 DataVisualization - Using Context Metrics:` - Confirms single source
- `🔄 Metrics changed - requesting chart generation:` - Detects changes
- `🎨 CHART GENERATION SUCCESS - DUAL UPDATE:` - Chart created
- `🔄 Chart data updated in BOTH prop and context` - Both paths updated
- `🖼️ PREVIEW: Chart data status:` - Preview receives data
- `✅ Preview: Chart image loaded successfully` - Image renders

## TROUBLESHOOTING

### If charts don't appear:
1. Check console for chart generation messages
2. Verify metrics are being updated in context
3. Try clicking "Capture Chart Image" button manually
4. Check if chart data URL is valid (starts with 'data:image')

### If infinite loops occur:
1. Check for useEffect dependency issues
2. Verify debouncing timeouts are working
3. Look for unnecessary re-renders in console
