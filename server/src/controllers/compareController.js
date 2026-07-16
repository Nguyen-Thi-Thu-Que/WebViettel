const CompareHistory = require('../models/CompareHistory');

exports.saveCompareSession = async (req, res, next) => {
  try {
    const {
      session_id,
      guest_id,
      is_guest,
      packages_compared,
      final_packages,
      selected_package,
      compare_count,
      compare_duration,
      viewed_detail_packages,
      completed,
      cleared_by_user,
      status,
      cleared_at
    } = req.body;

    if (!session_id) {
      return res.status(400).json({ success: false, message: 'session_id is required' });
    }

    // Find existing session
    let doc = await CompareHistory.findOne({ session_id });

    if (doc) {
      // Prevent downgrade of status
      if (doc.completed && !completed) {
        return res.json({ success: true, message: 'Session already completed, update ignored', data: doc });
      }
      if (doc.status === 'CLEARED' && status !== 'CLEARED') {
        return res.json({ success: true, message: 'Session already cleared, update ignored', data: doc });
      }

      // Update existing document
      doc.user_id = req.user ? req.user.user_id : doc.user_id;
      if (guest_id !== undefined) doc.guest_id = guest_id;
      if (is_guest !== undefined) doc.is_guest = is_guest;
      
      // Merge unique packages compared
      if (packages_compared && Array.isArray(packages_compared)) {
        const merged = new Set([...doc.packages_compared, ...packages_compared]);
        doc.packages_compared = Array.from(merged);
      }
      
      if (final_packages !== undefined) doc.final_packages = final_packages;
      if (selected_package !== undefined) doc.selected_package = selected_package;
      doc.compare_count = doc.packages_compared.length;
      if (compare_duration !== undefined) doc.compare_duration = compare_duration;
      
      if (viewed_detail_packages && Array.isArray(viewed_detail_packages)) {
        const mergedDetails = new Set([...doc.viewed_detail_packages, ...viewed_detail_packages]);
        doc.viewed_detail_packages = Array.from(mergedDetails);
      }

      if (completed !== undefined) doc.completed = completed;
      if (cleared_by_user !== undefined) doc.cleared_by_user = cleared_by_user;
      if (status !== undefined) doc.status = status;
      if (cleared_at !== undefined) doc.cleared_at = cleared_at;

      await doc.save();
      return res.json({ success: true, message: 'Session updated successfully', data: doc });
    } else {
      // Create new document
      const newDoc = new CompareHistory({
        session_id,
        user_id: req.user ? req.user.user_id : (req.body.user_id || null),
        guest_id,
        is_guest,
        packages_compared: packages_compared || [],
        final_packages: final_packages || [],
        selected_package: selected_package || null,
        compare_count: packages_compared ? packages_compared.length : 0,
        compare_duration: compare_duration || 0,
        viewed_detail_packages: viewed_detail_packages || [],
        completed: completed || false,
        cleared_by_user: cleared_by_user || false,
        status: status || 'ACTIVE',
        cleared_at: cleared_at || null,
        source: 'compare'
      });

      await newDoc.save();
      return res.json({ success: true, message: 'Session created successfully', data: newDoc });
    }
  } catch (error) {
    next(error);
  }
};

exports.getCompareAnalytics = async (req, res, next) => {
  try {
    const histories = await CompareHistory.find({});

    const totalSessions = histories.length;
    if (totalSessions === 0) {
      return res.json({
        success: true,
        data: {
          totalSessions: 0,
          mostComparedPackages: [],
          mostPopularPairs: [],
          conversionRate: 0,
          averageDuration: 0,
          resetCount: 0,
          guestUserRatio: { guest: 0, user: 0 },
          lastSelectedPackages: []
        }
      });
    }

    const packageCompareCounts = {};
    const pairCounts = {};
    let totalDuration = 0;
    let resetCount = 0;
    let guestCount = 0;
    let userCount = 0;
    const selectedPackageCounts = {};
    let completedCount = 0;

    histories.forEach(h => {
      if (h.packages_compared && Array.isArray(h.packages_compared)) {
        h.packages_compared.forEach(pkgId => {
          packageCompareCounts[pkgId] = (packageCompareCounts[pkgId] || 0) + 1;
        });

        // Unique pair combinations
        const uniquePkgs = Array.from(new Set(h.packages_compared)).sort();
        if (uniquePkgs.length >= 2) {
          for (let i = 0; i < uniquePkgs.length; i++) {
            for (let j = i + 1; j < uniquePkgs.length; j++) {
              const pairKey = `${uniquePkgs[i]} - ${uniquePkgs[j]}`;
              pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;
            }
          }
        }
      }

      totalDuration += h.compare_duration || 0;

      if (h.status === 'CLEARED' || h.cleared_by_user) {
        resetCount++;
      }

      if (h.is_guest) {
        guestCount++;
      } else {
        userCount++;
      }

      if (h.completed) {
        completedCount++;
      }

      if (h.selected_package) {
        selectedPackageCounts[h.selected_package] = (selectedPackageCounts[h.selected_package] || 0) + 1;
      }
    });

    const mostComparedPackages = Object.entries(packageCompareCounts)
      .map(([pkgId, count]) => ({ packageId: pkgId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const mostPopularPairs = Object.entries(pairCounts)
      .map(([pair, count]) => ({ pair, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const lastSelectedPackages = Object.entries(selectedPackageCounts)
      .map(([pkgId, count]) => ({ packageId: pkgId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const conversionRate = totalSessions > 0 ? (completedCount / totalSessions) * 100 : 0;
    const averageDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

    return res.json({
      success: true,
      data: {
        totalSessions,
        mostComparedPackages,
        mostPopularPairs,
        conversionRate,
        averageDuration,
        resetCount,
        guestUserRatio: { guest: guestCount, user: userCount },
        lastSelectedPackages
      }
    });
  } catch (error) {
    next(error);
  }
};
