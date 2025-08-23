
import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "./input"
import { Button } from "./button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Search, X, Clock, TrendingUp } from "lucide-react"

export interface SearchSuggestion {
  id: string;
  text: string;
  category?: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  showSuggestions?: boolean;
  showRecentSearches?: boolean;
  showTrendingSearches?: boolean;
  trendingSearches?: string[];
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  debounceMs?: number;
}

export const SearchInput = React.forwardRef<HTMLDivElement, SearchInputProps>(
  ({
    placeholder = "Rechercher...",
    value: controlledValue,
    onChange,
    onSearch,
    suggestions = [],
    recentSearches = [],
    showSuggestions = true,
    showRecentSearches = true,
    showTrendingSearches = false,
    trendingSearches = [],
    loading = false,
    disabled = false,
    className,
    debounceMs = 300,
    ...props
  }, ref) => {
    const [value, setValue] = React.useState(controlledValue || "");
    const [isOpen, setIsOpen] = React.useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = React.useState<SearchSuggestion[]>([]);
    const debounceRef = React.useRef<NodeJS.Timeout>();

    // Debounce pour les suggestions
    React.useEffect(() => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        if (value.trim();{
          const filtered = suggestions.filter(suggestion =>
            suggestion.text.toLowerCase().includes(value.toLowerCase();||
            suggestion.description?.toLowerCase().includes(value.toLowerCase();
          setFilteredSuggestions(filtered);
        } else {
          setFilteredSuggestions([]);
        }
      }, debounceMs);

      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, [value, suggestions, debounceMs]);

    // Sync with controlled value
    React.useEffect(() => {
      if (controlledValue !== undefined) {
        setValue(controlledValue);
      }
    }, [controlledValue]);

    const handleInputChange = (newValue: string) => {
      setValue(newValue);
      onChange?.(newValue);
      setIsOpen(newValue.length > 0 || showRecentSearches || showTrendingSearches);
    };

    const handleSearch = (searchValue: string = value) => {
      if (searchValue.trim();{
        onSearch?.(searchValue.trim();
        setIsOpen(false);
      }
    };

    const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
      setValue(suggestion.text);
      onChange?.(suggestion.text);
      handleSearch(suggestion.text);
    };

    const handleRecentSearchSelect = (search: string) => {
      setValue(search);
      onChange?.(search);
      handleSearch(search);
    };

    const clearSearch = () => {
      setValue("");
      onChange?.("");
      setIsOpen(false);
    };

    const hasContent = 
      (value.length > 0 && filteredSuggestions.length > 0) ||
      (value.length === 0 && (recentSearches.length > 0 || trendingSearches.length > 0);

    return (
      <div ref={ref} className={cn("relative", className} {...props}>
        <Popover open={isOpen && hasContent} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                type="search"
                placeholder={placeholder}
                value={value}
                onChange={(e) => handleInputChange(e.target.value}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                  if (e.key === "Escape") {
                    setIsOpen(false);
                  }
                }}
                onFocus={() => setIsOpen(hasContent}
                disabled={disabled}
                leftIcon={<Search className="h-4 w-4" />}
                rightIcon={
                  value && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSearch}
                      className="h-auto p-1 hover:bg-transparent"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )
                }
                className="pr-10"
              />
            </div>
          </PopoverTrigger>

          <PopoverContent 
            className="w-[--radix-popover-trigger-width] p-0" 
            side="bottom" 
            align="start"
          >
            <Command>
              <CommandList>
                {/* Suggestions basées sur la recherche */}
                {value.length > 0 && filteredSuggestions.length > 0 && (
                  <CommandGroup heading="Suggestions">
                    {filteredSuggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion.id}
                        onSelect={() => handleSuggestionSelect(suggestion}
                        className="flex items-center space-x-2"
                      >
                        {suggestion.icon && (
                          <div className="flex h-4 w-4 items-center justify-center">
                            {suggestion.icon}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{suggestion.text}</div>
                          {suggestion.description && (
                            <div className="text-xs text-muted-foreground">
                              {suggestion.description}
                            </div>
                          )}
                        </div>
                        {suggestion.category && (
                          <div className="text-xs text-muted-foreground">
                            {suggestion.category}
                          </div>
                        )}
                      </CommandItem>
                    );}
                  </CommandGroup>
                )}

                {/* Recherches récentes */}
                {value.length === 0 && showRecentSearches && recentSearches.length > 0 && (
                  <CommandGroup heading="Recherches récentes">
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <CommandItem
                        key={`recent-${index}`}
                        onSelect={() => handleRecentSearchSelect(search}
                        className="flex items-center space-x-2"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{search}</span>
                      </CommandItem>
                    );}
                  </CommandGroup>
                )}

                {/* Recherches tendances */}
                {value.length === 0 && showTrendingSearches && trendingSearches.length > 0 && (
                  <CommandGroup heading="Tendances">
                    {trendingSearches.slice(0, 3).map((search, index) => (
                      <CommandItem
                        key={`trending-${index}`}
                        onSelect={() => handleRecentSearchSelect(search}
                        className="flex items-center space-x-2"
                      >
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span>{search}</span>
                      </CommandItem>
                    );}
                  </CommandGroup>
                )}

                {/* Message si aucun résultat */}
                {value.length > 0 && filteredSuggestions.length === 0 && (
                  <CommandEmpty>
                    Aucune suggestion trouvée pour "{value}"
                  </CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
