import { ChevronDownIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupButton } from "../ui/input-group";
import { useState } from "react";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "../ui/combobox";
import { UserData } from "@/model/user-model";
import { useUsersHook } from "@/hooks/use-user-hook";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { ProductData } from "@/model/product-model";
import { useProductHook } from "@/hooks/use-product";

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

const DEFAULT_TYPE = values[0];

export function InputGroupDropdown({ onValueChange }: Props) {
    const [selectedType, setSelectedType] = useState<DropdownValue>(DEFAULT_TYPE);
    const [user, setUser] = useState<UserData | null>(null);
    const [product, setProduct] = useState<ProductData | null>(null);
    const [searchUser, setSearchUser] = useState<string>();
    const [searchProduct, setSearchProduct] = useState<string>();

    const isOperator = selectedType?.value === "Operator";
    const isWorkName = selectedType?.value === "Work Name";

    const debouncedSearchUser = useDebouncedValue(searchUser);
    const debouncedSearchProduct = useDebouncedValue(searchProduct);
    const { data: userData } = useUsersHook(
        { search: debouncedSearchUser },
        { enabled: isOperator },
    );
    const { data: productData } = useProductHook(
        { search: debouncedSearchProduct },
        { enabled: isWorkName },
    );

    const handleTypeChange = (type: DropdownValue) => {
        setSelectedType(type);
        // Switching type clears any previously chosen operator/typed value so
        // the parent does not keep receiving a stale selection.
        setUser(null);
        setProduct(null);
        setSearchUser(undefined);
        setSearchProduct(undefined);
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
                        onValueChange(`-${data?.name}`);
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
            ) : (
                <Combobox
                    items={productData?.data}
                    value={product}
                    onValueChange={(data) => {
                        setProduct(data);
                        onValueChange(data ? `${data.partNo}: ${data.partName}` : undefined);
                    }}
                    onInputValueChange={(value) => setSearchProduct(value)}
                    itemToStringLabel={(item: ProductData) => `${item.partNo}: ${item.partName}`}
                >
                    <ComboboxInput showTrigger={false} className="rounded-sm border-none flex-1" placeholder="Select a Product"/>
                    <ComboboxContent>
                        <ComboboxEmpty>No Product Found</ComboboxEmpty>
                        <ComboboxList>
                        {(item: ProductData) => (
                            <ComboboxItem key={item.id} value={item}>
                                <span className="text-lg w-36 shrink-0">{item.partNo}</span>
                                <span className="text-muted-foreground text-xs">{item.partName}</span>
                            </ComboboxItem>
                        )}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
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
