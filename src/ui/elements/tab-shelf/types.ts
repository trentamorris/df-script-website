export type TabValue = string | number
export type TabContextValue<V = TabValue> = {
    activeValue: V
    onSelect: (value: V) => void
}

export type TabProps<V = TabValue> = {
    value: V
    children?: React.ReactNode
    className?: string
}

export type TabShelfProps<V = TabValue> = {
    children: React.ReactNode
    activeValue: V
    onChange?: (value: V) => void
    className?: string
}