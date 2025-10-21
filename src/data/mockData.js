export const mockData = {
  supportedLanguages: [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "zh", name: "中文" }
  ],
  stationNames: [
    {
      stationId: "A32",
      languageCode: "es",
      localizedName: "42 St - Terminal de Autobuses Port Authority"
    },
    {
      stationId: "A32",
      languageCode: "zh",
      localizedName: "42街-港务局车站"
    },
    {
      stationId: "A33",
      languageCode: "es",
      localizedName: "34 St - Estación Penn"
    },
    {
      stationId: "A33",
      languageCode: "zh",
      localizedName: "34街-宾州车站"
    },
    {
      stationId: "A31",
      languageCode: "es",
      localizedName: "W 4 St - Washington Sq"
    },
    {
      stationId: "A31",
      languageCode: "zh",
      localizedName: "西4街-华盛顿广场站"
    },
    {
      stationId: "A40",
      languageCode: "es",
      localizedName: "High St - Brooklyn Bridge"
    },
    {
      stationId: "A40",
      languageCode: "zh",
      localizedName: "High St - 布鲁克林大桥站"
    }
  ],
  stations: [
    {
      stationId: "A32",
      nameDefault: "42 St - Port Authority Bus Terminal",
      borough: "Manhattan",
      lat: 40.757308,
      lon: -73.989735,
      upcomingTrains: [
        {
          tripId: "A-1205",
          routeId: "A",
          destination: "Inwood - 207 St",
          arrivalInMinutes: 3
        },
        {
          tripId: "C-875",
          routeId: "C",
          destination: "168 St",
          arrivalInMinutes: 6
        },
        {
          tripId: "E-442",
          routeId: "E",
          destination: "World Trade Center",
          arrivalInMinutes: 9
        }
      ]
    },
    {
      stationId: "A33",
      nameDefault: "34 St - Penn Station",
      borough: "Manhattan",
      lat: 40.752287,
      lon: -73.993391,
      upcomingTrains: [
        {
          tripId: "A-1210",
          routeId: "A",
          destination: "Far Rockaway",
          arrivalInMinutes: 4
        },
        {
          tripId: "C-872",
          routeId: "C",
          destination: "Euclid Av",
          arrivalInMinutes: 8
        }
      ]
    },
    {
      stationId: "A31",
      nameDefault: "W 4 St - Washington Sq",
      borough: "Manhattan",
      lat: 40.732338,
      lon: -74.000495,
      upcomingTrains: [
        {
          tripId: "E-460",
          routeId: "E",
          destination: "Jamaica Center",
          arrivalInMinutes: 5
        },
        {
          tripId: "C-880",
          routeId: "C",
          destination: "145 St",
          arrivalInMinutes: 10
        }
      ]
    },
    {
      stationId: "A40",
      nameDefault: "High St - Brooklyn Bridge",
      borough: "Brooklyn",
      lat: 40.699337,
      lon: -73.990531,
      upcomingTrains: [
        {
          tripId: "A-1230",
          routeId: "A",
          destination: "Ozone Park - Lefferts Blvd",
          arrivalInMinutes: 7
        },
        {
          tripId: "C-910",
          routeId: "C",
          destination: "168 St",
          arrivalInMinutes: 11
        }
      ]
    }
  ],
  routes: [
    {
      routeId: "A",
      shortName: "A Line",
      longName: "8 Avenue Express",
      geometry: [
        [40.86549, -73.92728],
        [40.85345, -73.92958],
        [40.82558, -73.94425],
        [40.80063, -73.95811],
        [40.7682, -73.98197],
        [40.757308, -73.989735],
        [40.752287, -73.993391],
        [40.732338, -74.000495],
        [40.715478, -74.009266],
        [40.699337, -73.990531],
        [40.68086, -73.95053]
      ],
      stationIds: ["A32", "A33", "A31", "A40"]
    },
    {
      routeId: "C",
      shortName: "C Line",
      longName: "8 Avenue Local",
      geometry: [
        [40.83404, -73.94186],
        [40.80772, -73.96411],
        [40.78582, -73.97212],
        [40.7682, -73.98197],
        [40.757308, -73.989735],
        [40.752287, -73.993391],
        [40.732338, -74.000495],
        [40.720824, -73.99596],
        [40.699337, -73.990531],
        [40.68086, -73.95053]
      ],
      stationIds: ["A32", "A33", "A31", "A40"]
    },
    {
      routeId: "E",
      shortName: "E Line",
      longName: "Queens Boulevard Local",
      geometry: [
        [40.754222, -73.942362],
        [40.74897, -73.9681],
        [40.760085, -73.978285],
        [40.757308, -73.989735],
        [40.752287, -73.993391],
        [40.739395, -73.992332],
        [40.732338, -74.000495],
        [40.711835, -74.011097]
      ],
      stationIds: ["A32", "A33", "A31"]
    }
  ],
  vehicles: [
    {
      vehicleId: "2294",
      routeId: "A",
      lat: 40.7484,
      lon: -73.9912,
      headsign: "A ➜ Rockaway",
      speed: 23,
      lastUpdate: "1 min ago"
    },
    {
      vehicleId: "3104",
      routeId: "C",
      lat: 40.7397,
      lon: -73.9979,
      headsign: "C ➜ Euclid Av",
      speed: 18,
      lastUpdate: "3 min ago"
    },
    {
      vehicleId: "5821",
      routeId: "E",
      lat: 40.7456,
      lon: -73.9854,
      headsign: "E ➜ World Trade",
      speed: 21,
      lastUpdate: "2 min ago"
    }
  ],
  serviceStatus: [
    {
      statusId: "status-a",
      routeId: "A",
      header: "Good Service",
      description: "Northbound trains are running on or close to schedule.",
      status: "GOOD SERVICE",
      condition: "good"
    },
    {
      statusId: "status-c",
      routeId: "C",
      header: "Delay near Canal St",
      description:
        "Trains are holding due to a signal issue at Canal St. Expect additional 8 minutes travel time.",
      status: "DELAYS",
      condition: "delay"
    },
    {
      statusId: "status-e",
      routeId: "E",
      header: "Planned Work",
      description:
        "Overnight work at World Trade Center. Shuttle buses replace service after midnight.",
      status: "SERVICE CHANGE",
      condition: "issue"
    }
  ],
  favorites: [
    {
      favoriteId: "fav-1",
      routeId: "A",
      stationName: "42 St - Port Authority",
      alertType: "Service alerts",
      pushEnabled: true,
      emailEnabled: false,
      createdAtIso: "2024-08-01T12:30:00Z",
      createdAtRelative: "3 days ago"
    },
    {
      favoriteId: "fav-2",
      routeId: "C",
      stationName: "34 St - Penn Station",
      alertType: "Accessibility",
      pushEnabled: true,
      emailEnabled: true,
      createdAtIso: "2024-08-03T08:15:00Z",
      createdAtRelative: "12 hours ago"
    }
  ],
  alerts: [
    {
      alertId: "alert-1",
      routeId: "C",
      stationName: "W 4 St - Washington Sq",
      header: "Signal issue at Canal St",
      description:
        "Northbound C trains are running with delays while crews investigate a signal problem at Canal St.",
      direction: "Northbound",
      startTime: "10:05 AM",
      startAtIso: "2024-08-04T14:05:00Z",
      lastUpdate: "2 min ago",
      severity: "issue"
    },
    {
      alertId: "alert-2",
      routeId: "E",
      stationName: "World Trade Center",
      header: "Overnight maintenance",
      description:
        "E trains do not run to World Trade Center overnight from 11:30 PM - 5:00 AM. Use the A train for service.",
      direction: "Both directions",
      startTime: "12:00 AM",
      startAtIso: "2024-08-04T04:00:00Z",
      lastUpdate: "30 min ago",
      severity: "info"
    }
  ],
  stationAccessibility: [
    {
      accessId: "acc-1",
      stationId: "A32",
      feature: "Elevator (Mezzanine to Street)",
      status: "In Service",
      description: "Elevator is operating normally.",
      lastReported: "15 min ago",
      lastReportedIso: "2024-08-04T13:45:00Z"
    },
    {
      accessId: "acc-2",
      stationId: "A33",
      feature: "Escalator (Platform to Street)",
      status: "Out of Service",
      description: "Escalator closed for repairs, use nearby elevator.",
      lastReported: "1 hour ago",
      lastReportedIso: "2024-08-04T12:50:00Z"
    }
  ],
  userPreference: {
    defaultLanguageName: "English",
    timeFormat: "12-hour (AM/PM)",
    units: "Imperial"
  },
  metrics: [
    {
      id: "metric-headway",
      label: "Average Headway",
      value: "6.5 min",
      trend: -4,
      caption: "Down 4% vs yesterday"
    },
    {
      id: "metric-on-time",
      label: "On-Time Performance",
      value: "89%",
      trend: 6,
      caption: "Improved after signal fixes"
    },
    {
      id: "metric-ridership",
      label: "Ridership Today",
      value: "245K",
      trend: 3,
      caption: "Morning peak exceeds average"
    }
  ]
};
