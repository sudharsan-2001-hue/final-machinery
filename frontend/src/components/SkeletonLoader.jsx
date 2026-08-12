import React from "react";
import "./SkeletonLoader.css";

const Skeleton = ({ className, style }) => (
  <div className={`skeleton ${className}`} style={style}></div>
);

export const ProductCardSkeleton = () => (
  <div className="catalog-card glass-card-base">
    <div className="catalog-img-wrapper">
      <Skeleton className="catalog-image-skeleton" />
      <Skeleton className="stock-badge-skeleton" />
      <Skeleton className="category-tag-skeleton" />
    </div>
    <div className="catalog-info">
      <Skeleton className="title-skeleton" />
      <Skeleton className="shop-tag-skeleton" />
      <Skeleton className="desc-skeleton" />
      <Skeleton className="weight-skeleton" />
      <div className="catalog-pricing-details">
        <Skeleton className="price-skeleton" />
        <Skeleton className="price-skeleton" />
      </div>
      <div className="catalog-actions-group">
        <Skeleton className="button-skeleton" />
        <Skeleton className="button-skeleton" />
      </div>
    </div>
  </div>
);

export const DashboardCardSkeleton = () => (
  <div className="stat-card glass-card-base">
    <Skeleton className="stat-icon-skeleton" />
    <div className="stat-content">
      <Skeleton className="stat-value-skeleton" />
      <Skeleton className="stat-label-skeleton" />
    </div>
  </div>
);

export const OrderRowSkeleton = () => (
  <div className="order-row glass-card-base">
    <Skeleton className="order-id-skeleton" />
    <Skeleton className="order-customer-skeleton" />
    <Skeleton className="order-amount-skeleton" />
    <Skeleton className="order-status-skeleton" />
    <Skeleton className="order-date-skeleton" />
  </div>
);

export const StockRowSkeleton = () => (
  <div className="stock-row glass-card-base">
    <Skeleton className="stock-product-skeleton" />
    <Skeleton className="stock-quantity-skeleton" />
    <Skeleton className="stock-status-skeleton" />
  </div>
);

export const FullPageSkeleton = () => (
  <div className="full-page-skeleton">
    <div className="skeleton-header">
      <Skeleton className="header-logo-skeleton" />
      <Skeleton className="header-title-skeleton" />
    </div>
    <div className="skeleton-content">
      <div className="skeleton-grid">
        {[...Array(4)].map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>
      <div className="skeleton-list">
        {[...Array(5)].map((_, i) => (
          <OrderRowSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
