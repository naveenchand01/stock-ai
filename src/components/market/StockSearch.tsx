import * as React from "react";
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { stocksApi } from "@/services/stocks.api";
import { useDebounce } from "@/hooks/useDebounce"; // I need to create this or check if it exists
import { SearchResult } from "@/types/stock.types";

interface StockSearchProps {
    onSelect: (symbol: string) => void;
    selectedSymbol?: string;
    placeholder?: string;
    className?: string;
}

export function StockSearch({ onSelect, selectedSymbol, placeholder = "Search stocks...", className }: StockSearchProps) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const debouncedQuery = useDebounce(query, 500);

    const { data: searchResults, isLoading } = useQuery({
        queryKey: ['search', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery) return [];
            const response = await stocksApi.search(debouncedQuery);
            // The API client interceptor already unwraps response.data.data
            // Yahoo finance results have 'quotes' array
            return response.quotes || response || [];
        },
        enabled: debouncedQuery.length > 1,
        initialData: [],
    });

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-[250px] justify-between text-muted-foreground bg-background/50 backdrop-blur-sm border-white/10",
                        className
                    )}
                >
                    {selectedSymbol
                        ? selectedSymbol
                        : placeholder}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-gray-900 border-gray-800">
                <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Search symbol like TCS, RELIANCE..."
                            value={query}
                            onValueChange={setQuery}
                        />
                    <CommandList>
                        {isLoading && (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                        )}
                        {!isLoading && searchResults?.length === 0 && debouncedQuery.length > 1 && (
                            <CommandEmpty>No stock found.</CommandEmpty>
                        )}
                        <CommandGroup>
                            {(searchResults as SearchResult[])?.map((stock) => (
                                <CommandItem
                                    key={stock.symbol}
                                    value={stock.symbol}
                                    onSelect={(currentValue) => {
                                        onSelect(stock.symbol);
                                        setOpen(false);
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-white">{stock.symbol}</span>
                                        <span className="text-xs text-muted-foreground">{stock.shortname || stock.longname}</span>
                                    </div>
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            selectedSymbol === stock.symbol ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
