import styles from "./style.module.scss";

import React, { useEffect, useState } from "react";
import {
  useLazyGetItemsQuery,
  useGetStateQuery,
  usePostSelectionMutation,
  usePostSortOrderMutation,
} from "../../api/main";

import { listSize } from "../../constants/main";
import { Items } from "../../types/main";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableItem from "../SortableItem";

const ItemsList = () => {
  const [triggerGetItems, { data: items = [], isFetching }] =
    useLazyGetItemsQuery();

  const [postSelection] = usePostSelectionMutation();
  const [postSortOrder] = usePostSortOrderMutation();

  const { data: stateData } = useGetStateQuery();

  const [itemsList, setItemList] = useState<Items[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  useEffect(() => {
    if (stateData) {
      setSelected(new Set(stateData.selected));
    }
  }, [stateData]);

  const fetchMoreItems = async (custOffset: number) => {
    const result = await triggerGetItems({
      search,
      offset: custOffset,
      limit: listSize,
    });

    if (result?.data?.length) {
      if (custOffset === 0) {
        setItemList(result.data);
      } else {
        setItemList((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = result.data!.filter(
            (item) => !existingIds.has(item.id)
          );
          return [...prev, ...newItems];
        });
      }

      setOffset(custOffset + listSize);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      fetchMoreItems(offset);
    }
  };

  useEffect(() => {
    setItemList([]);
    setOffset(0);
    fetchMoreItems(0);
  }, [search]);

  const handleSelect = (id: number) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelected(newSet);
    postSelection(Array.from(newSet));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItemList((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      const updated = arrayMove(prev, oldIndex, newIndex);
      postSortOrder(updated.map((r) => r.id));
      return updated;
    });
  };

  return (
    <div className={styles.container} onScroll={handleScroll}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className={styles.input}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={itemsList.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {itemsList.map((item) => (
            <SortableItem
              key={item.id}
              id={item.id}
              checked={selected.has(item.id)}
              onSelect={() => handleSelect(item.id)}
              name={item.name}
            />
          ))}
        </SortableContext>
      </DndContext>

      {isFetching && <p>Loading more...</p>}
    </div>
  );
};

export default ItemsList;
