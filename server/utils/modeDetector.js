/**
 * Mode Detection Utility
 * 
 * Determines if the application is running in test mode or production mode.
 * Test mode allows single-player games with test_balance.
 * Production mode requires PVP with real balance.
 * 
 * Safety: Test mode is NEVER enabled in production, even if TEST_MODE=true
 */

/**
 * Check if test mode is enabled
 * @returns {boolean} True if test mode should be active
 */
function isTestModeEnabled() {
    const testModeEnv = process.env.TEST_MODE?.toLowerCase();
    const isTestEnabled = ['true', '1', 'yes'].includes(testModeEnv);
    const isProduction = process.env.NODE_ENV === 'production';

    // Safety override: Never allow test mode in production
    if (isProduction && isTestEnabled) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ WARNING: TEST_MODE cannot be enabled in production!');
        console.error('❌ Forcing test mode OFF for production safety');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return false;
    }

    return isTestEnabled;
}

/**
 * Get detailed mode information
 * @returns {object} Mode details for API responses
 */
function getModeInfo() {
    const testMode = isTestModeEnabled();
    const nodeEnv = process.env.NODE_ENV || 'development';

    return {
        isTestMode: testMode,
        environment: nodeEnv,
        testModeReason: testMode
            ? 'TEST_MODE environment variable is enabled'
            : null,
        description: testMode
            ? 'Single-player mode with test balance'
            : 'Production PVP mode with real balance'
    };
}

/**
 * Log the current mode on startup
 */
function logModeStatus() {
    const testMode = isTestModeEnabled();
    const nodeEnv = process.env.NODE_ENV || 'development';

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (testMode) {
        console.log('🧪 TEST MODE ENABLED');
        console.log('   Environment: ' + nodeEnv);
        console.log('   Game Mode: Single-player with test balance');
        console.log('   Real SOL transactions: DISABLED');
    } else {
        console.log('🎮 PRODUCTION MODE ENABLED');
        console.log('   Environment: ' + nodeEnv);
        console.log('   Game Mode: PVP matchmaking with real balance');
        console.log('   Test features: DISABLED');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

module.exports = {
    isTestModeEnabled,
    getModeInfo,
    logModeStatus
};
