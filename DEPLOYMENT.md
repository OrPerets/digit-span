# 🚀 Vercel Deployment Guide

## ✅ **Ready for Vercel!**

Your project is now configured to deploy to Vercel with both frontend and backend.

## 📋 **Prerequisites**

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional): `npm i -g vercel`

## 🛠️ **Setup Steps**

### 1. **Push to GitHub**
```bash
git add .
git commit -m "Add Vercel serverless functions"
git push origin main
```

### 2. **Import to Vercel**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure build settings (auto-detected for React)

### 3. **Add Environment Variables**
In Vercel dashboard → Settings → Environment Variables:

1. **Variable Name**: `MONGODB_URI`  
2. **Value**: `mongodb+srv://or-experiment:Perets12@sqlmentor.ydqmecv.mongodb.net/?retryWrites=true&w=majority&appName=SQLMentor`  
3. **Environment**: Check all three: Production, Preview, Development
4. Click "Save"

**Important**: Add the environment variable directly in the Vercel dashboard, not as a secret reference.

### 4. **Deploy**
Click "Deploy" - Vercel will build and deploy automatically!

## 🏗️ **Project Structure**

```
digit-span/
├── api/                    # Serverless functions
│   ├── _lib/
│   │   └── mongodb.js     # Database connection
│   ├── health.js          # GET /api/health
│   └── digit-span/
│       ├── results.js     # GET/POST /api/digit-span/results
│       └── results/
│           └── [participantId].js  # GET /api/digit-span/results/[id]
├── src/                   # React frontend
│   ├── utils/
│   │   └── api.js        # API URL helper
│   └── ...
├── vercel.json           # Vercel configuration
└── package.json
```

## 🔄 **Development vs Production**

### **Local Development**
```bash
# Terminal 1: Start Express server
npm run server

# Terminal 2: Start React app  
npm start
```

### **Production (Vercel)**
- Frontend: Static React app
- Backend: Serverless functions in `/api` folder
- Automatic environment switching

## 📡 **API Endpoints**

After deployment, your endpoints will be:

- **Health**: `https://your-app.vercel.app/api/health`
- **Save Results**: `POST https://your-app.vercel.app/api/digit-span/results`
- **Get Results**: `GET https://your-app.vercel.app/api/digit-span/results`
- **Get by ID**: `GET https://your-app.vercel.app/api/digit-span/results/[participantId]`

## 🧪 **Testing Deployment**

1. Complete a digit span task
2. Check results page for ✅ success message
3. Visit `/api/health` to verify backend is working
4. Check Vercel dashboard → Functions tab for logs

## 🔧 **Custom Domain (Optional)**

In Vercel dashboard → Settings → Domains:
- Add your custom domain
- DNS records will be provided
- SSL certificate automatically generated

## 📊 **Monitoring**

- **Vercel Dashboard**: Function logs, performance metrics
- **MongoDB Atlas**: Database usage, query performance
- **Analytics**: Built-in Vercel analytics available

## 🚨 **Troubleshooting**

### **Common Issues**

#### ❌ `Environment Variable "MONGODB_URI" references Secret "mongodb_uri", which does not exist`
**Solution**: Don't use secret references. Add `MONGODB_URI` directly in Vercel dashboard → Settings → Environment Variables.

#### ❌ `Cannot connect to MongoDB`
**Solutions**:
- Verify MongoDB URI is correct in environment variables
- Check Atlas IP whitelist includes `0.0.0.0/0` (allow all IPs for Vercel)
- Test connection in Vercel Functions tab logs

### **Debugging Commands**
```bash
# Check if variables are set in Vercel
vercel env ls

# View function logs for debugging
vercel logs your-deployment-url

# Test deployment locally
vercel dev
```

## 🎯 **Benefits of Vercel Deployment**

✅ **Automatic deployments** from GitHub  
✅ **Global CDN** for fast loading  
✅ **Serverless scaling** - pay per use  
✅ **Built-in SSL** certificates  
✅ **Preview deployments** for PRs  
✅ **Zero-config** deployment  

Your digit span task is now ready for production! 🎉 