# BAAZ GRAMMER SCHOOL - ERP System | Developer Documentation

## 📋 Architecture Overview

The BAAZ GRAMMER SCHOOL ERP is a single-page application (SPA) built with vanilla JavaScript, HTML5, and CSS3.

### Core Structure

```
Application
├── Sidebar Navigation (Fixed)
│   ├── School Logo & Info
│   └── Navigation Menu Items
├── Header (Fixed)
│   ├── Current Page Title
│   └── User Profile Menu
└── Content Area (Scrollable)
    └── Dynamic Page Content
```

## 🔌 JavaScript Functions

### Main Navigation Function
```javascript
function showPage(pageId) {
    // Hides all pages, shows selected one
    // Updates active nav link
    // Updates header title
}
```

**Usage:**
```html
<button onclick="showPage('students')">Go to Students</button>
```

## 📁 CSS Structure

### CSS Variables (Color System)
```css
:root {
    --primary: #1e40af;           /* Main blue */
    --primary-dark: #1e3a8a;      /* Darker blue */
    --secondary: #0ea5e9;         /* Sky blue */
    --accent: #f59e0b;            /* Amber */
    --success: #10b981;           /* Green */
    --danger: #ef4444;            /* Red */
    --warning: #f97316;           /* Orange */
}
```

### Key CSS Classes

| Class | Purpose |
|-------|---------|
| `.page` | Page container (hidden by default) |
| `.page.active` | Currently visible page |
| `.card` | Dashboard card component |
| `.table-container` | Data table wrapper |
| `.badge` | Status indicator |
| `.btn` | Button styling |
| `.stat-card` | Statistics card |

## 📊 Page Structure

### Dashboard (`id="dashboard"`)
- 4 statistic cards
- 6 quick-access module cards
- Clickable cards for navigation

### Students (`id="students"`)
- Header with action button
- Search placeholder
- Data table with columns:
  - Roll No
  - Name
  - Class
  - Father Name
  - Phone
  - Status

### Attendance (`id="attendance"`)
- Header with action button
- Class selector
- Attendance table with columns:
  - Student Name
  - Roll No
  - Date
  - Status
  - Percentage

### Fees (`id="fees"`)
- Fee tracking table
- Columns: Student, Roll No, Fee, Paid, Due, Status
- Financial overview

### Academics (`id="academics"`)
- Grade management table
- Columns: Student, Class, Subject, Marks, Grade, Remarks
- Performance tracking

### Staff (`id="staff"`)
- Staff directory table
- Columns: Name, Designation, Department, Email, Phone, Status

### Reports (`id="reports"`)
- 6 report card options
- Visual cards with icons
- Ready for integration

## 🎯 Integration Points

### For Database Integration
1. Replace table `<tbody>` sections with dynamic data
2. Fetch data on page load
3. Implement CRUD operations

**Example:**
```javascript
async function loadStudents() {
    const data = await fetch('/api/students').then(r => r.json());
    // Populate table with data
}
```

### For API Integration
```javascript
const API_BASE = 'https://your-api.com';

// GET Students
fetch(`${API_BASE}/students`)
    .then(r => r.json())
    .then(data => populateStudentsTable(data));

// POST New Student
fetch(`${API_BASE}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData)
});
```

### For Authentication
```javascript
// Add login check
window.addEventListener('load', () => {
    if (!isUserLoggedIn()) {
        window.location.href = '/login.html';
    }
});
```

## 🎨 Customization Guide

### Adding a New Page

1. **Add HTML structure:**
```html
<div class="page" id="newpage">
    <!-- Content here -->
</div>
```

2. **Add navigation item:**
```html
<li class="nav-item">
    <button class="nav-link" onclick="showPage('newpage')">
        <i class="fas fa-icon"></i>
        <span>New Page</span>
    </button>
</li>
```

3. **Update title mapping:**
```javascript
const titles = {
    'newpage': 'New Page Title'
};
```

### Changing Colors

Edit `:root` CSS variables:
```css
:root {
    --primary: #YOUR_COLOR;
    --secondary: #YOUR_COLOR;
}
```

### Modifying Table Columns

Edit table `<thead>` and `<tbody>`:
```html
<thead>
    <tr>
        <th>Your Column</th>
        <!-- More columns -->
    </tr>
</thead>
```

## 📦 Dependencies

- **Font Awesome 6.4.0** - Icon library
  - Link: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`

## 🔐 Security Considerations

### For Production:

1. **Never store sensitive data in frontend code**
2. **Use environment variables for API endpoints**
3. **Implement proper authentication**
4. **Validate all user inputs**
5. **Use HTTPS only**
6. **Implement CORS properly**
7. **Add rate limiting**
8. **Encrypt sensitive data in transit**

## 📱 Responsive Design Breakpoints

```css
@media (max-width: 768px) {
    /* Mobile styles */
    .sidebar { width: 70px; }
    .nav-link span { display: none; }
    .main-content { margin-left: 70px; }
}
```

## 🧪 Testing Checklist

- [ ] All navigation links work
- [ ] Pages load correctly
- [ ] Tables display properly
- [ ] Status badges appear correctly
- [ ] Responsive design works
- [ ] Icons load from CDN
- [ ] No console errors
- [ ] Mobile view looks good

## 📈 Performance Optimization

1. **Lazy load images**
2. **Minimize CSS/JS**
3. **Use local storage for cache**
4. **Defer non-critical JS**
5. **Optimize table rendering**
6. **Use CSS Grid for layouts**

## 🚀 Deployment

### Static Hosting (Recommended)
- Netlify
- Vercel
- GitHub Pages
- AWS S3

### Docker Deployment
```dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY dashboard.html /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📚 File Reference

| File | Purpose | Type |
|------|---------|------|
| `index.html` | Main application | HTML |
| `dashboard.html` | Backup version | HTML |
| `README.md` | User documentation | Markdown |
| `QUICKSTART.md` | Quick guide | Markdown |

## 🔄 Future Enhancement Ideas

1. **Dark Mode Toggle**
2. **Multi-language Support**
3. **PDF Export**
4. **Real-time Notifications**
5. **Advanced Filtering**
6. **Data Visualization Charts**
7. **Bulk Operations**
8. **User Profiles**
9. **Audit Logs**
10. **Mobile App Version**

## 💡 Troubleshooting

### Page doesn't show
- Check if page ID in HTML matches function call
- Verify `.page` class is present
- Check browser console for errors

### Styling issues
- Clear browser cache
- Check CSS variable values
- Verify no conflicting CSS
- Use browser DevTools to inspect

### Navigation not working
- Verify `onclick` handler syntax
- Check if function is defined
- Look for JavaScript errors

## 📞 Support Resources

- Font Awesome Icons: https://fontawesome.com/icons
- CSS Grid Guide: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout
- Responsive Design: https://web.dev/responsive-web-design-basics/

---

**Last Updated:** July 2024
**Version:** 1.0.0
**Maintenance:** Active
