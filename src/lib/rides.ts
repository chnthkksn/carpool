import { getDb } from "@/lib/mongodb";

export type Ride = {
  id: string;
  from: string;
  to: string;
  dateLabel: string;
  timeLabel: string;
  priceLkr: number;
  seatsLeft: number;
  driverName: string;
  driverRating: number;
};

type RideDocument = Omit<Ride, "id"> & {
  _id?: string;
};

const seedRides: Omit<Ride, "id">[] = [
  {
    from: "Colombo",
    to: "Kandy",
    dateLabel: "Sat, Feb 28",
    timeLabel: "06:30 AM",
    priceLkr: 1800,
    seatsLeft: 2,
    driverName: "Kasun Perera",
    driverRating: 4.8,
  },
  {
    from: "Galle",
    to: "Colombo",
    dateLabel: "Sat, Feb 28",
    timeLabel: "07:15 AM",
    priceLkr: 1500,
    seatsLeft: 1,
    driverName: "Nadeesha Silva",
    driverRating: 4.9,
  },
  {
    from: "Negombo",
    to: "Ella",
    dateLabel: "Sun, Mar 1",
    timeLabel: "05:50 AM",
    priceLkr: 3400,
    seatsLeft: 3,
    driverName: "Tharindu Jayasekara",
    driverRating: 4.7,
  },
  {
    from: "Kurunegala",
    to: "Jaffna",
    dateLabel: "Sun, Mar 1",
    timeLabel: "09:00 AM",
    priceLkr: 3900,
    seatsLeft: 2,
    driverName: "Iresha Fernando",
    driverRating: 4.6,
  },
];

export async function getFeaturedRides(limit = 4): Promise<Ride[]> {
  try {
    const database = await getDb();
    const ridesCollection = database.collection<RideDocument>("rides");

    const count = await ridesCollection.countDocuments();

    if (count === 0) {
      await ridesCollection.insertMany(seedRides);
    }

    const rides = await ridesCollection.find().limit(limit).toArray();

    return rides.map((ride) => ({
      id: String(ride._id ?? `${ride.from}-${ride.to}-${ride.timeLabel}`),
      from: ride.from,
      to: ride.to,
      dateLabel: ride.dateLabel,
      timeLabel: ride.timeLabel,
      priceLkr: ride.priceLkr,
      seatsLeft: ride.seatsLeft,
      driverName: ride.driverName,
      driverRating: ride.driverRating,
    }));
  } catch {
    return seedRides.slice(0, limit).map((ride, index) => ({
      id: `local-${index}`,
      ...ride,
    }));
  }
}
