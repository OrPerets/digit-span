# Digit Span Task - MongoDB Integration

## 🗄️ Database Setup
- **Database**: `test`
- **Collection**: `digitSpan`
- **Connection**: MongoDB Atlas

## 🚀 How to Run

### Option 1: Run both server and client together
```bash
npm run dev
```

### Option 2: Run separately
```bash
# Terminal 1: Start the backend server
npm run server

# Terminal 2: Start the React app
npm start
```

## 📊 Data Stored

Each completed task saves:

### Summary Data
- `participantId`: Auto-generated unique ID
- `totalTrials`: Number of trials completed
- `correctTrials`: Number of correct responses
- `accuracy`: Percentage correct
- `direction`: Always "backward"
- `sessionTimestamp`: When task started
- `completedAt`: When task finished

### Trial-by-Trial Details
- `trialId`: Unique identifier (e.g., "practice1", "2a")
- `trialIndex`: Position in sequence (0, 1, 2...)
- `isPractice`: Whether this was a practice trial
- `digitsShown`: Array of digits displayed [4, 7, 1]
- `correctAnswer`: Expected response [1, 7, 4]
- `userResponse`: What user entered [1, 7, 4]
- `isCorrect`: Boolean result
- `responseTime`: Milliseconds from display end to submission
- `timestamp`: When trial was completed

## 🔍 API Endpoints

### Save Results
```
POST http://localhost:5000/api/digit-span/results
```

### Get All Results (last 10)
```
GET http://localhost:5000/api/digit-span/results
```

### Get Results by Participant ID
```
GET http://localhost:5000/api/digit-span/results/{participantId}
```

### Health Check
```
GET http://localhost:5000/api/health
```

## 📱 Frontend Integration

The React app automatically:
1. Collects detailed trial data during the task
2. Measures response times
3. Sends data to MongoDB when task completes
4. Shows success/error feedback to user
5. Displays participant ID for reference

## 🔧 Configuration

Environment variables in `.env`:
```
MONGODB_URI="your-connection-string"
PORT=5000
```

## 📈 Sample Data Structure

```json
{
  "_id": "...",
  "participantId": "participant_abc12345",
  "sessionTimestamp": "2024-01-20T14:30:00.000Z",
  "completedAt": "2024-01-20T14:35:00.000Z",
  "totalTrials": 14,
  "correctTrials": 10,
  "accuracy": 71.43,
  "direction": "backward",
  "completed": true,
  "passFailMap": {
    "practice1": true,
    "practice2": false,
    "1a": true,
    "1b": true,
    "2a": false
  },
  "trialResults": [
    {
      "trialId": "practice1",
      "trialIndex": 0,
      "isPractice": true,
      "digitsShown": [2, 8],
      "correctAnswer": [8, 2],
      "userResponse": [8, 2],
      "isCorrect": true,
      "responseTime": 1247,
      "timestamp": "2024-01-20T14:30:15.123Z"
    }
  ],
  "createdAt": "2024-01-20T14:35:00.000Z",
  "updatedAt": "2024-01-20T14:35:00.000Z"
}
``` 