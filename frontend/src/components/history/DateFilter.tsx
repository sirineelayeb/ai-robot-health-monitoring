import { Button } from "../ui/button";
import { theme } from "../../config/theme";

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (value: string) => void;
}

export default function DateFilter({
  selectedDate,
  onDateChange,
}: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <label className={theme.typography.label}>
        Filter by Date:
      </label>

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        className="border rounded px-3 py-2"
        style={{ borderColor: theme.colors.border.default }}
      />

      <Button variant="secondary" onClick={() => onDateChange("")}>
        Reset
      </Button>
    </div>
  );
}
