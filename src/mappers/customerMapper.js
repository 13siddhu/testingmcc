exports.mapShopifyToRista = (shopifyCustomer) => {

    // Rista expects 10-digit local number only — strip country code and + prefix
    // e.g. +919876543210 → 9876543210
    const rawPhone = shopifyCustomer.phone || "";
    const cleanPhone = rawPhone.replace(/^\+?91/, "").replace(/\D/g, "").slice(-10);

    return {

        firstName: shopifyCustomer.first_name || shopifyCustomer.firstName || (shopifyCustomer.name ? shopifyCustomer.name.split(' ')[0] : "Coffee Lover"),

        lastName: shopifyCustomer.last_name || shopifyCustomer.lastName || (shopifyCustomer.name && shopifyCustomer.name.split(' ').length > 1 ? shopifyCustomer.name.split(' ').slice(1).join(' ') : ""),

        email: shopifyCustomer.email,

        phoneNumber: cleanPhone

    };

};

exports.mapRistaToFrontend = (customer) => {

    return {

        customerId: customer.id,

        name: `${customer.firstName} ${customer.lastName}`,

        email: customer.email,

        phone: customer.phoneNumber,

        membership: customer.membership?.name || null,

        points: customer.loyaltyInfo?.points || 0,

        reservedPoints: customer.loyaltyInfo?.reservedPoints || 0,

        pointsEndingThisMonth:
            customer.loyaltyInfo?.pointsEndingThisMonth || 0,

        pointsEndingNextMonth:
            customer.loyaltyInfo?.pointsEndingNextMonth || 0

    };

};