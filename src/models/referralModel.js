/**
 * Referral Model
 * 
 * In-memory storage for referral codes and tracking.
 * For production, migrate to a database (MongoDB, PostgreSQL, etc.)
 */

class ReferralStore {
    constructor() {
        // Store format: { code: { ...referralData } }
        this.referrals = new Map();
        
        // Store format: { orderId: code }
        this.orderReferrals = new Map();
        
        // Initialize with some default referrals for testing
        this._initializeDefaults();
    }

    _initializeDefaults() {
        // Example: Staff referral codes
        this.createReferral({
            code: 'STAFF001',
            name: 'Store Manager',
            email: 'manager@mycoffeeco.com',
            type: 'staff',
            commission: 5, // percentage
            active: true
        });

        this.createReferral({
            code: 'PARTNER01',
            name: 'Corporate Partner',
            email: 'partner@example.com',
            type: 'partner',
            commission: 10,
            active: true
        });

        // Diya's referral code
        this.createReferral({
            code: 'STA8QGZ13',
            name: 'Diya',
            email: 'guptadiya172@gmail.com',
            type: 'staff',
            commission: 5,
            active: true
        });
    }

    /**
     * Create a new referral code
     */
    createReferral({ code, name, email, type, commission, active = true }) {
        const referral = {
            code: code.toUpperCase(),
            name,
            email,
            type, // 'staff', 'partner', 'influencer', 'customer'
            commission, // percentage
            active,
            createdAt: new Date(),
            totalOrders: 0,
            totalRevenue: 0,
            orders: []
        };

        this.referrals.set(referral.code, referral);
        return referral;
    }

    /**
     * Get referral by code
     */
    getReferral(code) {
        return this.referrals.get(code.toUpperCase());
    }

    /**
     * Get all referrals
     */
    getAllReferrals() {
        return Array.from(this.referrals.values());
    }

    /**
     * Track an order with referral code
     */
    trackOrder(code, orderData) {
        const referral = this.getReferral(code);
        if (!referral) return null;

        const orderTracking = {
            orderId: orderData.orderId,
            invoiceNumber: orderData.invoiceNumber,
            shopifyOrderNumber: orderData.shopifyOrderNumber,
            amount: orderData.amount,
            commission: (orderData.amount * referral.commission) / 100,
            customerEmail: orderData.customerEmail,
            customerPhone: orderData.customerPhone,
            branch: orderData.branch,
            channel: orderData.channel,
            timestamp: new Date()
        };

        referral.orders.push(orderTracking);
        referral.totalOrders += 1;
        referral.totalRevenue += orderData.amount;

        // Store the mapping
        this.orderReferrals.set(orderData.orderId, code.toUpperCase());

        return orderTracking;
    }

    /**
     * Get referral code for an order
     */
    getOrderReferral(orderId) {
        const code = this.orderReferrals.get(orderId);
        return code ? this.getReferral(code) : null;
    }

    /**
     * Get statistics for a referral code
     */
    getStats(code) {
        const referral = this.getReferral(code);
        if (!referral) return null;

        return {
            code: referral.code,
            name: referral.name,
            type: referral.type,
            totalOrders: referral.totalOrders,
            totalRevenue: referral.totalRevenue,
            totalCommission: referral.orders.reduce((sum, o) => sum + o.commission, 0),
            averageOrderValue: referral.totalOrders > 0 
                ? (referral.totalRevenue / referral.totalOrders).toFixed(2) 
                : 0,
            orders: referral.orders.map(o => ({
                invoiceNumber: o.invoiceNumber,
                amount: o.amount,
                commission: o.commission,
                timestamp: o.timestamp
            }))
        };
    }

    /**
     * Update referral details
     */
    updateReferral(code, updates) {
        const referral = this.getReferral(code);
        if (!referral) return null;

        Object.assign(referral, updates);
        return referral;
    }

    /**
     * Delete referral
     */
    deleteReferral(code) {
        return this.referrals.delete(code.toUpperCase());
    }

    /**
     * Validate referral code
     */
    isValidReferral(code) {
        const referral = this.getReferral(code);
        return referral && referral.active;
    }

    /**
     * Generate a unique referral code
     */
    generateCode(prefix = '') {
        let code;
        do {
            const random = Math.random().toString(36).substring(2, 8).toUpperCase();
            code = prefix ? `${prefix}${random}` : random;
        } while (this.referrals.has(code));
        
        return code;
    }
}

// Singleton instance
const referralStore = new ReferralStore();

module.exports = referralStore;
