import { updateBookingStatus } from "@/app/actions/bookings";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  type BookingStatus,
} from "@/lib/booking/labels";

/** Plain server-action form, like the lead status form. */
export function BookingStatusForm({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  const id = `booking-status-${bookingId}`;
  return (
    <form action={updateBookingStatus} className="flex items-center gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <label htmlFor={id} className="sr-only">
        Status
      </label>
      <NativeSelect id={id} name="status" defaultValue={status} className="h-8 w-auto">
        {BOOKING_STATUSES.map((s) => (
          <option key={s} value={s}>
            {BOOKING_STATUS_LABELS[s]}
          </option>
        ))}
      </NativeSelect>
      <Button type="submit" size="sm" variant="outline">
        Save
      </Button>
    </form>
  );
}
