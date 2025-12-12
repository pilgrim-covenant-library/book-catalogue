# PCC Library Catalogue - Deployment Checklist

## Files That MUST Be Uploaded to Your Website

### 1. Main HTML File
- ✅ `index.html` (330 KB)
  - **Location on website:** `/index.html` or `/library/index.html`

### 2. CSS Files (New Folder Required!)
- ✅ Create folder: `assets/css/` (if it doesn't exist)
- ✅ Upload: `assets/css/catalogue-enhanced.css` (39 KB)
  - **Location on website:** `/assets/css/catalogue-enhanced.css`

### 3. JavaScript Files (New Folder Required!)
- ✅ Create folder: `assets/js/` (if it doesn't exist)
- ✅ Upload: `assets/js/catalogue-enhanced.js` (55 KB)
  - **Location on website:** `/assets/js/catalogue-enhanced.js`

### 4. PWA Files (Root Directory)
- ✅ `manifest.json` (940 bytes)
  - **Location on website:** `/manifest.json`
- ✅ `service-worker.js` (2.6 KB)
  - **Location on website:** `/service-worker.js`

## Verification Steps

After uploading, verify the files are accessible:

1. **Check CSS loads:**
   - Visit: `https://your-website.com/assets/css/catalogue-enhanced.css`
   - Should show CSS code (not 404 error)

2. **Check JS loads:**
   - Visit: `https://your-website.com/assets/js/catalogue-enhanced.js`
   - Should show JavaScript code (not 404 error)

3. **Check main page:**
   - Visit: `https://your-website.com/index.html`
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Should see: "✅ Loaded 2594 books"

4. **Test functionality:**
   - Click Children tab → Should show 426 books
   - Click Card view → Should show book cards
   - Click theme toggle → Should switch light/dark

## Common Issues & Solutions

### Issue: Buttons Don't Work
**Cause:** Enhanced JS/CSS files not uploaded or wrong path
**Solution:**
- Verify `assets/css/catalogue-enhanced.css` exists on server
- Verify `assets/js/catalogue-enhanced.js` exists on server
- Check browser console (F12) for 404 errors

### Issue: No Styling
**Cause:** CSS file not loaded
**Solution:**
- Check file path in index.html matches server structure
- Ensure `assets/css/` folder exists
- Clear browser cache (Ctrl+Shift+Delete)

### Issue: Search Doesn't Work
**Cause:** JavaScript file not loaded
**Solution:**
- Check browser console for JavaScript errors
- Verify `assets/js/catalogue-enhanced.js` loaded
- Check file permissions on server

### Issue: Tabs Show No Rows
**Cause:** Old version of index.html deployed
**Solution:**
- Re-upload the latest `index.html` (330 KB version)
- Clear browser cache
- Do a hard refresh (Ctrl+F5)

## File Structure on Server

Your website should have this structure:

```
/
├── index.html (330 KB)
├── manifest.json (940 bytes)
├── service-worker.js (2.6 KB)
└── assets/
    ├── css/
    │   └── catalogue-enhanced.css (39 KB)
    └── js/
        └── catalogue-enhanced.js (55 KB)
```

## Browser Cache

After deploying, users may need to:
1. Clear browser cache
2. Hard refresh (Ctrl+F5 or Cmd+Shift+R)
3. Close and reopen browser

## Testing After Deployment

Run these tests in browser console (F12):

```javascript
// Test 1: Check if enhanced files loaded
console.log(window.PCC ? '✅ Enhanced JS loaded' : '❌ Enhanced JS missing');

// Test 2: Check book count
console.log('Books loaded:', window.PCC?.State?.books.length || 0);

// Test 3: Test tab switching
document.querySelectorAll('button.tab-btn')[1].click();
setTimeout(() => {
  console.log('Children rows:', $('#children-table').DataTable().rows().count());
}, 1000);
```

Expected output:
```
✅ Enhanced JS loaded
Books loaded: 2594
Children rows: 426
```

## Git Deployment (if using Git)

If you're using Git to deploy:

```bash
cd /home/jonathan/book-catalogue
git add -A
git commit -m "Deploy enhanced catalogue with all features"
git push origin main
```

Then pull on your server:

```bash
cd /path/to/website
git pull origin main
```

## FTP Deployment

If using FTP:
1. Connect to your server via FTP client (FileZilla, etc.)
2. Navigate to website root
3. Create `assets/css/` and `assets/js/` folders
4. Upload all 5 files maintaining folder structure
5. Set file permissions to 644 (readable by web server)

## Final Checklist

- [ ] Uploaded index.html
- [ ] Created assets/css/ folder
- [ ] Uploaded catalogue-enhanced.css
- [ ] Created assets/js/ folder
- [ ] Uploaded catalogue-enhanced.js
- [ ] Uploaded manifest.json
- [ ] Uploaded service-worker.js
- [ ] Tested CSS loads (no 404)
- [ ] Tested JS loads (no 404)
- [ ] Tested tab switching
- [ ] Tested view modes
- [ ] Tested search
- [ ] Cleared browser cache
- [ ] Hard refreshed page

---

**Last Updated:** December 12, 2024
**Files Ready For Deployment:** ✅ All files in `/home/jonathan/book-catalogue/`
