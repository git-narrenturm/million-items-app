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
  const [dragIndex, setDragIndex] = useState<number | null>(null);

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
        const newItems = result.data!.filter((item) => !existingIds.has(item.id));
        return [...prev, ...newItems];
      });
    }

    setOffset((prev) => prev + listSize);
  }
};


  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop === clientHeight) {
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

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;

    const updated = [...itemsList];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setItemList(updated);
    setDragIndex(null);
    postSortOrder(updated.map((r) => r.id));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
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
      {itemsList.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(index)}
          className={styles.listItem}
        >
          <input
            type="checkbox"
            checked={selected.has(item.id)}
            onChange={() => handleSelect(item.id)}
          />
          {item.name}
        </div>
      ))}
      {isFetching && <p>Loading more...</p>}
    </div>
  );
};

export default ItemsList;
