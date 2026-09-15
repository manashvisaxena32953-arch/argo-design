import type { Problem } from "./types";

export const PROBLEMS: Problem[] = [
  {
    id: "parking-lot",
    slug: "parking-lot",
    title: "Parking Lot",
    difficulty: "Medium",
    estimatedMinutes: 20,
    summary:
      "Model a multi-level parking lot that allocates spots by vehicle type and bills on exit.",
    statement:
      "Design the low-level structure of a parking lot system. The lot has multiple levels, each level has spots of different sizes, and vehicles of different types arrive and leave throughout the day. On exit, the system issues a fee based on how long the vehicle stayed and what kind of spot it used.",
    functionalRequirements: [
      "Multiple vehicle types can enter (motorcycle, car, bus).",
      "Parking spots can support different vehicle types.",
      "A vehicle can be parked and removed.",
      "The system should calculate parking fees.",
      "The system should handle unavailable parking spaces.",
    ],
    constraints: [
      "A large lot may hold 1000+ spots, so allocation must not scan everything naively.",
      "Pricing rules change per lot and must be replaceable without touching allocation.",
      "A spot holds at most one vehicle at a time.",
    ],
    expectedBehaviours: [
      "Parking a bus when no large spot is free fails gracefully with a clear result.",
      "Removing a vehicle frees its spot immediately and produces a ticket total.",
      "Fee calculation is driven by duration and spot/vehicle type.",
    ],
    hints: [
      "Separate allocation from pricing — a pricing strategy keeps fees swappable.",
      "Grouping free spots by type gives you O(1) lookup instead of scanning.",
      "A Ticket object is often a cleaner carrier of entry time than the Vehicle itself.",
    ],
    tags: ["strategy", "composition", "allocation"],
  },
  {
    id: "vending-machine",
    slug: "vending-machine",
    title: "Vending Machine",
    difficulty: "Easy",
    estimatedMinutes: 15,
    summary:
      "Model a coin-operated vending machine with clear states, inventory and change handling.",
    statement:
      "Design a vending machine. A customer inserts coins, selects a product, and the machine either dispenses the product with change, or rejects the request. The machine behaves differently depending on what has happened so far.",
    functionalRequirements: [
      "Accept coins of several denominations.",
      "Allow a product to be selected and dispensed.",
      "Return correct change, or refuse if change cannot be made.",
      "Allow the transaction to be cancelled and money refunded.",
      "Track inventory per slot.",
    ],
    constraints: [
      "The machine must never dispense a product it cannot make change for.",
      "Only one transaction can be active at a time.",
      "Inventory and cash float are finite.",
    ],
    expectedBehaviours: [
      "Selecting a sold-out product returns a clear failure and keeps the money.",
      "Cancelling before dispensing refunds every inserted coin.",
      "Inserting coins while dispensing is rejected.",
    ],
    hints: [
      "The behaviour changes by phase — consider the State pattern over a pile of booleans.",
      "Change-making is its own responsibility; keep it out of the machine class.",
      "Model money as a value type rather than a raw number of cents everywhere.",
    ],
    tags: ["state", "inventory"],
  },
  {
    id: "elevator-system",
    slug: "elevator-system",
    title: "Elevator System",
    difficulty: "Medium",
    estimatedMinutes: 20,
    summary:
      "Model a bank of elevators that serve hall and cabin requests with a replaceable scheduling policy.",
    statement:
      "Design an elevator control system for a building with several elevator cars. Passengers press hall buttons on floors and cabin buttons inside the car. A controller decides which car serves which request and each car moves, stops and opens doors accordingly.",
    functionalRequirements: [
      "Handle hall requests (floor + direction) and cabin requests (target floor).",
      "Dispatch a request to one of several elevator cars.",
      "Each car tracks current floor, direction and door state.",
      "Requests are served in a sensible order, not purely first-come.",
      "Support idle, moving and maintenance states for a car.",
    ],
    constraints: [
      "A car cannot change direction while it still has requests ahead of it.",
      "Scheduling policy must be replaceable (nearest-car, look, scan).",
      "Doors must not open while the car is moving.",
    ],
    expectedBehaviours: [
      "A hall-up request on floor 3 is not served by a car descending past floor 3 with pending stops.",
      "A car in maintenance receives no new requests.",
      "Duplicate requests for the same floor collapse into one stop.",
    ],
    hints: [
      "Keep the dispatcher and the car separate; the dispatcher owns policy, the car owns motion.",
      "A SchedulingStrategy interface makes the policy swappable and testable.",
      "Requests are a first-class concept, not just integers.",
    ],
    tags: ["strategy", "state", "scheduling"],
  },
  {
    id: "library-management",
    slug: "library-management",
    title: "Library Management System",
    difficulty: "Medium",
    estimatedMinutes: 20,
    summary:
      "Model members, catalogued books and the borrow/return lifecycle with fines and reservations.",
    statement:
      "Design a library system. Members search a catalogue, borrow copies of a book, return them, and are fined when late. Popular titles can be reserved and members are notified when a copy becomes available.",
    functionalRequirements: [
      "Search the catalogue by title, author or ISBN.",
      "Borrow and return a physical copy of a book.",
      "Enforce a per-member borrowing limit and loan period.",
      "Calculate fines for overdue returns.",
      "Reserve a title that is fully lent out.",
    ],
    constraints: [
      "A book title may have many physical copies; a loan is against a copy, not the title.",
      "Fine policy differs per member type (student, staff).",
      "A member blocked for unpaid fines cannot borrow.",
    ],
    expectedBehaviours: [
      "Borrowing past the limit is rejected with a clear reason.",
      "Returning an overdue copy creates a fine record and frees the copy.",
      "A returned copy with an active reservation goes to the reserver, not the shelf.",
    ],
    hints: [
      "Distinguish Book (catalogue entry) from BookCopy (physical item).",
      "Fine calculation is policy — keep it behind an interface per member type.",
      "Notifications are a good fit for an observer-style abstraction.",
    ],
    tags: ["observer", "policy", "lifecycle"],
  },
  {
    id: "tic-tac-toe",
    slug: "tic-tac-toe",
    title: "Tic-Tac-Toe",
    difficulty: "Easy",
    estimatedMinutes: 15,
    summary:
      "Model a turn-based board game with pluggable players and clean win detection.",
    statement:
      "Design a tic-tac-toe game. Two players alternate placing marks on an n x n board until one wins or the board fills. The design should make it easy to add a computer player later.",
    functionalRequirements: [
      "Support two players taking alternating turns.",
      "Validate a move before applying it.",
      "Detect win, draw and ongoing states.",
      "Support a board size larger than 3x3.",
      "Report the game result at the end.",
    ],
    constraints: [
      "A move on an occupied cell or out of bounds must be rejected.",
      "Win detection should not re-scan the whole board on every move if avoidable.",
      "A human and a computer player must be interchangeable.",
    ],
    expectedBehaviours: [
      "Playing out of turn is rejected.",
      "A full board with no line is reported as a draw, not a loss.",
      "The game is immutable once finished.",
    ],
    hints: [
      "A Player abstraction lets HumanPlayer and BotPlayer be swapped freely.",
      "Keep rules (win detection) out of the Board's storage responsibility.",
      "Row/column/diagonal counters make win checks O(1) per move.",
    ],
    tags: ["strategy", "rules"],
  },
];

export const getProblem = (id: string): Problem | undefined =>
  PROBLEMS.find((p) => p.id === id);
