"use client";

import { useActionState } from "react";

import {
  addBookingBlock,
  addBookingHours,
  type BookingFormState,
} from "@/app/actions/bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { WEEKDAY_LABELS } from "@/config/booking";

const initialState: BookingFormState = {};

function Message({ state }: { state: BookingFormState }) {
  if (state.error)
    return (
      <p role="alert" className="text-destructive text-sm">
        {state.error}
      </p>
    );
  if (state.success)
    return (
      <p role="status" className="text-sm text-emerald-700">
        {state.success}
      </p>
    );
  return null;
}

// Monday first, the way the team plans a week.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function AddHoursForm() {
  const [state, action, pending] = useActionState(addBookingHours, initialState);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div>
        <Label htmlFor="weekday">Day</Label>
        <NativeSelect
          id="weekday"
          name="weekday"
          className="mt-1.5 w-40"
          defaultValue="1"
        >
          {WEEK_ORDER.map((d) => (
            <option key={d} value={d}>
              {WEEKDAY_LABELS[d]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div>
        <Label htmlFor="start">From</Label>
        <Input
          id="start"
          name="start"
          type="time"
          step={1800}
          required
          className="mt-1.5 w-32"
        />
      </div>
      <div>
        <Label htmlFor="end">To</Label>
        <Input
          id="end"
          name="end"
          type="time"
          step={1800}
          required
          className="mt-1.5 w-32"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add hours"}
      </Button>
      <div className="basis-full">
        <Message state={state} />
      </div>
    </form>
  );
}

export function AddBlockForm() {
  const [state, action, pending] = useActionState(addBookingBlock, initialState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="fromDate">From date</Label>
          <Input id="fromDate" name="fromDate" type="date" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="fromTime">From time (optional)</Label>
          <Input id="fromTime" name="fromTime" type="time" className="mt-1.5 w-32" />
        </div>
        <div>
          <Label htmlFor="toDate">To date</Label>
          <Input id="toDate" name="toDate" type="date" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="toTime">To time (optional)</Label>
          <Input id="toTime" name="toTime" type="time" className="mt-1.5 w-32" />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <Label htmlFor="reason">Reason (optional, only you see it)</Label>
          <Input id="reason" name="reason" maxLength={200} className="mt-1.5" />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Blocking…" : "Block this time"}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        Leave the times empty to block whole days. Existing bookings stay in place; cancel
        them separately if needed.
      </p>
      <Message state={state} />
    </form>
  );
}
