import styles from "./style.module.scss";
import React, { useEffect, useState } from "react";
import {
  useLazyGetItemsQuery,
  useGetStateQuery,
  usePostSelectionMutation,
  usePostSortOrderMutation,
  usePostResetSortOrderMutation,
  usePostResetSelectedMutation,
} from "../../api/main";

import { listSize } from "../../constants/main";
import { Items } from "../../types/main";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
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

  const [postResetSortOrder] = usePostResetSortOrderMutation();
  const [postResetSelection] = usePostResetSelectedMutation();
  const [postSelection] = usePostSelectionMutation();
  const [postSortOrder] = usePostSortOrderMutation();
  const { data: stateData } = useGetStateQuery();

  const [itemsList, setItemList] = useState<Items[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
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

  const handleFilterReset = () => {
    setSearch("");
  };

  const handleSortReset = async () => {
    await postResetSortOrder();
    setItemList([]);
    setOffset(0);
    fetchMoreItems(0);
  };

  const handleSelectReset = async () => {
    await postResetSelection();
    setSelected(new Set());
    setItemList([]);
    setOffset(0);
    fetchMoreItems(0);
  };

  const handleSelect = (id: number) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);

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

      const orderNums = updated.map((item) => item.orderNum);

      let newOrderNums = [...orderNums];

      let insertBeforeOrder =
        newIndex === 0 ? 0 : updated[newIndex - 1].orderNum;

      newOrderNums[newIndex] = insertBeforeOrder + 1;

      for (let i = newIndex + 1; i < updated.length; i++) {
        if (newOrderNums[i] <= newOrderNums[i - 1]) {
          newOrderNums[i] = newOrderNums[i - 1] + 1;
        }
      }

      const updatedWithOrderNum = updated.map((item, idx) => ({
        ...item,
        orderNum: newOrderNums[idx],
      }));

      const newOrder = updatedWithOrderNum.map((i) => ({
        id: i.id,
        orderNum: i.orderNum,
      }));
      postSortOrder({ order: newOrder });

      return updatedWithOrderNum;
    });
  };

  useEffect(() => {
    setItemList([]);
    setOffset(0);
    fetchMoreItems(0);
  }, [search]);

  return (
    <div className={styles.container} onScroll={handleScroll}>
      <div className={styles.controls}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className={styles.input}
        />
        <button className={styles.button} onClick={handleFilterReset}>
          Clear filter
        </button>
        <button className={styles.button} onClick={handleSortReset}>
          Reset sort
        </button>
        <button className={styles.button} onClick={handleSelectReset}>
          Reset select
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={itemsList.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {itemsList.map((item, index) => (
            <SortableItem
              key={item.id}
              id={item.id}
              name={item.name}
              orderNum={item.orderNum}
              checked={selected.has(item.id)}
              onSelect={() => handleSelect(item.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {isFetching && <p>Loading more...</p>}
    </div>
  );
};

export default ItemsList;
