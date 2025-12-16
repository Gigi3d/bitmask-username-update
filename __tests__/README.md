# Test Suite for Validation Flow

This directory contains tests for the step-by-step validation flow implementation.

## Test Structure

- `api/` - API endpoint tests
  - `verify-old-username.test.ts` - Tests for old username verification endpoint

- `components/` - Component tests
  - `Step1Form.test.tsx` - Tests for Step 1 form (old username input)
  - `Step2Form.test.tsx` - Tests for Step 2 form (new username input)

## Running Tests

These tests are written using Jest syntax. To run them, you'll need to:

1. Install testing dependencies:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @types/jest
```

2. Configure Jest in `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"]
  }
}
```

3. Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom';
```

4. Run tests:

```bash
npm test
```

## Test Coverage

### API Endpoints

- ✅ Input validation
- ✅ Database lookup logic
- ✅ Error handling
- ✅ Case-insensitive matching

### Components

- ✅ Form rendering
- ✅ Input validation
- ✅ API integration
- ✅ Loading states
- ✅ Error display
- ✅ Success flow

## Manual Testing Checklist

While automated tests are being set up, you can manually test:

1. **Step 1 - Old Username Verification**
   - [ ] Enter invalid username (empty, too long) → Shows error
   - [ ] Enter username not in database → Shows "not found" error
   - [ ] Enter valid username → Shows loading, then proceeds to Step 2

2. **Step 2 - New Username Submission**
   - [ ] Enter new username → Submits successfully
   - [ ] Handle submission errors gracefully

## Notes

- Tests use mock fetch to avoid actual API calls during testing
- Tests verify both success and error paths
- Tests check for proper error messages and user feedback
- Loading states are verified to ensure good UX
