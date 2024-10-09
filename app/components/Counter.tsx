"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

export function Counter({ name }: { name: string }) {
  const [amount, setAmount] = useState(0);

  return (
    <div className="flex items-center gap-x-4">
      <input type="hidden" name={name} value={amount} />
      <Button
        variant="outline"
        size="icon"
        type="button"
        onClick={() => setAmount((a) => (a > 0 ? a - 1 : a))}
      >
        <Minus className="h-4 w-4 text-primary" />
      </Button>
      <p className="font-medium text-lg">{amount}</p>
      <Button
        variant="outline"
        size="icon"
        type="button"
        onClick={() => setAmount((a) => a + 1)}
      >
        <Plus className="h-4 w-4 text-primary" />
      </Button>
    </div>
  );
}
