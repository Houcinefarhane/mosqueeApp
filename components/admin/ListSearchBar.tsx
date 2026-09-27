import Link from "next/link";
import { Search } from "lucide-react";
import Button from "@/components/ui/Button";

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
    <form method="GET" action={action} className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="outline">
          Rechercher
        </Button>
        {defaultValue && (
          <Link href={action}>
            <Button type="button" variant="ghost">
              Effacer
            </Button>
          </Link>
        )}
      </div>
    </form>
  );
}
