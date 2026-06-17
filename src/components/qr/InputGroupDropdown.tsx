import { ChevronDownIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "../ui/input-group";
import { useState } from "react";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "../ui/combobox";
import { UserData } from "@/model/user-model";
import { useUsersHook } from "@/hooks/use-user-hook";
import { useDebouncedValue } from "@/hooks/use-debounce";

type DropdownValue = {
    id: number,
    value: string
}

type Props = {
    onValueChange: (v: string | undefined) => void
}

const values: DropdownValue[] = [
    {id: 1, value: "Work Name"},
    {id: 2, value: "Operator"},
];

export function InputGroupDropdown({ onValueChange }: Props) {
    const [selectedType, setSelectedType] = useState<DropdownValue>();
    const [user, setUser] = useState<UserData | null>(null);
    const [searchUser, setSearchUser] = useState<string>();
    const [textValue, setTextValue] = useState("");

    const isOperator = selectedType?.value === "Operator";

    const debouncedSearchUser = useDebouncedValue(searchUser);
    const { data: userData } = useUsersHook(
        { search: debouncedSearchUser },
        { enabled: isOperator },
    );

    const handleTypeChange = (type: DropdownValue) => {
        setSelectedType(type);
        // Switching type clears any previously chosen operator/typed value so
        // the parent does not keep receiving a stale selection.
        setUser(null);
        setSearchUser(undefined);
        setTextValue("");
        onValueChange(undefined);
    };

    return (
        <InputGroup>
            {isOperator ? (
                <Combobox
                    items={userData?.data}
                    value={user}
                    onValueChange={(data) => {
                        setUser(data);
                        onValueChange(data?.name);
                    }}
                    onInputValueChange={(value) => setSearchUser(value)}
                    itemToStringLabel={(item: UserData) => item.name}
                >
                    <ComboboxInput showTrigger={false} className="rounded-sm border-none flex-1" placeholder="Select an User"/>
                    <ComboboxContent>
                        <ComboboxEmpty>No User Found</ComboboxEmpty>
                        <ComboboxList>
                        {(item: UserData) => (
                            <ComboboxItem key={item.id} value={item}>
                            { item.name }
                            </ComboboxItem>
                        )}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
            ):(
                <InputGroupInput
                    value={textValue}
                    onChange={(e) => {
                        setTextValue(e.target.value);
                        onValueChange(e.target.value);
                    }}
                    placeholder="Type here..."
                />
            )}
            <InputGroupAddon align="inline-end">
                <DropdownMenu>
                    <DropdownMenuTrigger render={
                        <InputGroupButton variant="ghost" className="pr-1.5! text-xs">
                            {selectedType?.value || "Select type..."} <ChevronDownIcon className="size-3" />
                        </InputGroupButton>
                    }/>
                    <DropdownMenuContent align="end" className="[--radius:0.95rem]">
                        <DropdownMenuGroup>
                            {values.map((v) => (
                                <DropdownMenuItem
                                    key={v.id}
                                    onClick={() => handleTypeChange(v)}
                                >{v.value}</DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </InputGroupAddon>
        </InputGroup>
    )
}
