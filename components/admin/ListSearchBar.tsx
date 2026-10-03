import Link from "next/link";
import Button from "@/components/ui/Button";
import SearchInput from "@/components/ui/SearchInput";

type ListSearchBarProps = {
  action: string;
  defaultValue?: string;
  placeholder?: string;
};

export default function ListSearchBar({
  action,
  defaultValue = "",
  placeholder = "Rechercher…",
}: ListSearchBarProps) {
  return (
    <form method="GET" action={action} className="flex flex-col gap-2 sm:flex-row">
      <SearchInput
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
      <div className="flex gap-2">
        <Button type="submit" variant="outline" className="flex-1 sm:flex-none">
          Rechercher
        </Button>
        {defaultValue && (
          <Link href={action} className="flex-1 sm:flex-none">
            <Button type="button" variant="ghost" className="w-full">
              Effacer
            </Button>
          </Link>
        )}
      </div>
    </form>
  );
}
