import styles from "./style.module.scss";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SortableItemProps = {
  id: number;
  name: string;
  checked: boolean;
  orderNum: number;
  onSelect: () => void;
};

const SortableItem = ({
  id,
  name,
  checked,
  orderNum,
  onSelect,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={styles.listItem}
    >
      <input type="checkbox" checked={checked} onChange={onSelect} />
      <span>{orderNum}.</span>
      <span>{name}</span>
    </div>
  );
};

export default SortableItem;
