-- Existing check-ins are legacy; new pet-era check-ins explicitly opt in.
ALTER TABLE "HabitCheckIn" ADD COLUMN "petEra" BOOLEAN NOT NULL DEFAULT false;
