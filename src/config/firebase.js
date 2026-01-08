let admin = null;
let firebaseApp = null;
let firebaseDatabase = null;
let logger = null;

// Lazy load Firebase Admin SDK and logger to prevent crashes if Firebase is not available
try {
  admin = require('firebase-admin');
  logger = require('../utils/logger');
} catch (error) {
  // Firebase Admin SDK not installed or logger not available
  // Will handle gracefully
}

// Initialize Firebase Admin SDK
try {
  if (!admin) {
    // Firebase Admin SDK not installed
    if (logger) {
      logger.warn('Firebase Admin SDK not installed. Support system will use MongoDB only.');
    }
  } else {
    // Check if Firebase credentials are provided
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Initialize with service account credentials from environment variables
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      };

      // Check if app already initialized (prevent duplicate initialization)
      try {
        firebaseApp = admin.app();
        firebaseDatabase = admin.database();
        if (logger) {
          logger.info('Firebase Admin SDK already initialized', {
            projectId: process.env.FIREBASE_PROJECT_ID
          });
        }
      } catch (e) {
        // App not initialized, initialize now
        try {
          firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
          });

          firebaseDatabase = admin.database();
          
          if (logger) {
            logger.info('Firebase Admin SDK initialized successfully', {
              projectId: process.env.FIREBASE_PROJECT_ID
            });
          }
        } catch (initError) {
          if (logger) {
            logger.error('Failed to initialize Firebase', {
              error: initError.message,
              projectId: process.env.FIREBASE_PROJECT_ID
            });
          }
          // Continue without Firebase - don't crash
        }
      }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Initialize with service account file path
      try {
        const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        
        // Check if app already initialized (prevent duplicate initialization)
        try {
          firebaseApp = admin.app();
          firebaseDatabase = admin.database();
          if (logger) {
            logger.info('Firebase Admin SDK already initialized from service account file', {
              projectId: serviceAccount.project_id
            });
          }
        } catch (e) {
          // App not initialized, initialize now
          try {
            firebaseApp = admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
            });

            firebaseDatabase = admin.database();
            
            if (logger) {
              logger.info('Firebase Admin SDK initialized successfully from service account file', {
                projectId: serviceAccount.project_id
              });
            }
          } catch (initError) {
            if (logger) {
              logger.error('Failed to initialize Firebase from service account file', {
                error: initError.message,
                path: process.env.FIREBASE_SERVICE_ACCOUNT_PATH
              });
            }
            // Continue without Firebase - don't crash
          }
        }
      } catch (requireError) {
        if (logger) {
          logger.error('Failed to load Firebase service account file', {
            path: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
            error: requireError.message
          });
        }
      }
    } else {
      if (logger) {
        logger.warn('Firebase credentials not provided. Support system will use MongoDB only.');
      }
    }
  }
} catch (error) {
  if (logger) {
    logger.error('Firebase initialization failed', {
      error: error.message,
      stack: error.stack
    });
  }
  // Continue without Firebase - don't crash the server
}

module.exports = {
  firebaseApp,
  firebaseDatabase,
  admin
};

