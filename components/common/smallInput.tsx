import { InputAdornment, TextField } from "@mui/material";

export const SmallInput = ({
  amountValue,
  amountChanged,
  loading,
}: {
  amountValue: string;
  amountChanged: (_event: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}) => {
  return (
    <div className="mb-1">
      <label htmlFor="slippage">Slippage</label>
      <div className="flex w-full max-w-[72px] flex-wrap items-center rounded-[10px] bg-primaryBg">
        <TextField
          id="slippage"
          placeholder="0.00"
          fullWidth
          value={amountValue}
          onChange={amountChanged}
          disabled={loading}
          autoComplete="off"
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
          }}
        />
      </div>
    </div>
  );
};
